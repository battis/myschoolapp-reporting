import cli from '@battis/qui-cli';
import { Mutex } from 'async-mutex';
import EventEmitter from 'node:events';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Page, Protocol } from 'puppeteer';
import * as common from '../../../common.js';
import { DownloadData, DownloadError } from '../Cache.js';
import {
  ContentDisposition,
  filenameFromDisposition
} from '../filenameFromDisposition.js';
import { Strategy } from './Strategy.js';

type PrepareOptions = {
  host: string;
  credentials: common.puppeteer.args.Parsed['loginCredentials'];
};

type FilepathVariantsOptions = {
  url: string;
  filename?: string;
  guid: string;
};

export type Options = PrepareOptions & {
  outputPath: string;
};

const TEMP = path.join('/tmp/msar/download', crypto.randomUUID());
const DOWNLOADS = path.join(os.homedir(), 'Downloads');

export class AuthenticatedFetch extends EventEmitter implements Strategy {
  private outputPath: string;
  private _parent?: Page;
  private preparing = new Mutex();

  public constructor({ outputPath, host, credentials }: Options) {
    super();
    this.outputPath = outputPath;
    this.preparing.acquire().then(() => this.prepare({ host, credentials }));
  }

  private async prepare({ host, credentials }: PrepareOptions) {
    this.parent = await common.puppeteer.openURL(`https://${host}`);
    await common.puppeteer.login(this.parent, credentials);
    this.preparing.release();
  }

  private get parent() {
    if (!this._parent) {
      throw new Error('Authenticated._page not initialized');
    }
    return this._parent;
  }
  private set parent(parent) {
    this._parent = parent;
  }

  public async download(url: string, filename?: string) {
    if (this.preparing.isLocked()) {
      await this.preparing.acquire();
      this.preparing.release();
    }
    const page = await this.parent.browser().newPage();
    const client = await page.createCDPSession();

    await client.send('Fetch.enable', {
      patterns: [
        {
          urlPattern: '*',
          requestStage: 'Response'
        }
      ]
    });

    client.on(
      'Fetch.requestPaused',
      (async (requestPausedEvent: Protocol.Fetch.RequestPausedEvent) => {
        const { requestId } = requestPausedEvent;
        const reqUrl = new URL(requestPausedEvent.request.url);
        const fetchUrl = new URL(url);
        if (reqUrl.pathname === fetchUrl.pathname) {
          filename =
            filename ||
            filenameFromDisposition({
              url,
              value: requestPausedEvent.responseHeaders?.find(
                (header) => header.name === ContentDisposition
              )?.value
            });
          await client.send(
            'Fetch.fulfillRequest',
            this.asAttachment(requestPausedEvent)
          );
        } else {
          await client.send('Fetch.continueRequest', { requestId });
        }
      }).bind(this)
    );

    client.on(
      'Browser.downloadProgress',
      (async (downloadEvent: Protocol.Browser.DownloadProgressEvent) => {
        if (downloadEvent.state === 'completed') {
          const after = fs.readdirSync(DOWNLOADS);
          const possiblePaths = this.filepathVariants({
            url,
            filename,
            guid: downloadEvent.guid
          });

          const localPath = new URL(url).pathname;
          const destFilepath = path.resolve(
            process.cwd(),
            common.output.filePathFromOutputPath(this.outputPath, localPath)!
          );
          const dir = path.dirname(destFilepath);
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          try {
            let key: keyof typeof possiblePaths;
            for (key in possiblePaths) {
              if (fs.existsSync(possiblePaths[key])) {
                fs.renameSync(possiblePaths[key], destFilepath);
                cli.log.debug(
                  `Moved ${key} file to ${cli.colors.url(localPath)}`
                );
                this.emit(url, { localPath, filename });
                return;
              }
            }
            const ext = path.extname(localPath);
            const possible = after
              .filter((f) => !f.endsWith('.crdownload') && !f.startsWith('.'))
              .filter((f) => !before.includes(f))
              .filter(
                (f) =>
                  f.endsWith(ext) ||
                  (/\.jpe?g$/i.test(localPath) && /\.jpe?g$/i.test(f))
              );
            if (possible.length === 0) {
              throw new Error(
                'No possible downloads, likely 404 redirect to HTML error page'
              );
            } else if (possible.length == 1) {
              const possiblePath = path.join(DOWNLOADS, possible.shift()!);
              fs.renameSync(possiblePath, destFilepath);
              if (
                filename === path.basename(localPath) &&
                filename !== path.basename(possiblePath)
              ) {
                filename = path
                  .basename(localPath)
                  .replace(/( \(\d+\))(\.[^.]+)$/, '$2');
              }
              this.emit(url, { localPath, filename });
            } else {
              // TODO reduce copy-pasta in favor of reusable functions
              setTimeout(
                (() => {
                  const next = fs.readdirSync(DOWNLOADS);
                  const lastResort = possible.filter((f) => next.includes(f));
                  if (lastResort.length === 1) {
                    const possiblePath = path.join(
                      DOWNLOADS,
                      lastResort.shift()!
                    );
                    fs.renameSync(possiblePath, destFilepath);
                    if (
                      filename === path.basename(localPath) &&
                      filename !== path.basename(possiblePath)
                    ) {
                      filename = path
                        .basename(localPath)
                        .replace(/( \(\d+\))(\.[^.]+)$/, '$2');
                    }
                    this.emit(url, { localPath, filename });
                  } else {
                    cli.log.error(
                      `Could not identify ${cli.colors.url(url)} download: ${lastResort.map((p) => cli.colors.value(p)).join(', ')}`
                    );
                    this.emit(url, { error: lastResort });
                  }
                }).bind(this),
                1000
              );
            }
          } catch (error) {
            cli.log.error(
              `Download ${cli.colors.url(url)} failed: ${cli.colors.error(error)}`
            );
            this.emit(url, { error });
          }
        }
      }).bind(this)
    );

    client.send('Browser.setDownloadBehavior', {
      behavior: 'allowAndName',
      downloadPath: TEMP,
      eventsEnabled: true
    });

    const before = fs.readdirSync(DOWNLOADS);
    return new Promise<DownloadData | DownloadError>((resolve) => {
      const listener = async (downloadData: DownloadData | DownloadError) => {
        this.removeListener(url, listener);
        await page.close();
        resolve(downloadData);
      };
      this.on(url, listener);
      page.goto(url).catch((error) => cli.log.debug(`Ignored: ${error}`));
    });
  }

  private asAttachment(
    requestPausedEvent: Protocol.Fetch.RequestPausedEvent
  ): Protocol.Fetch.FulfillRequestRequest {
    const responseHeaders = requestPausedEvent.responseHeaders || [];
    const i = responseHeaders.findIndex(
      (header) => header.name.toLowerCase() === ContentDisposition
    );
    const contentDispositionHeader = {
      name: ContentDisposition,
      value:
        i >= 0
          ? responseHeaders[i].value.replace('inline', 'attachment')
          : 'attachment'
    };
    if (i >= 0) {
      responseHeaders[i] = contentDispositionHeader;
    } else {
      responseHeaders.push(contentDispositionHeader);
    }
    return { ...requestPausedEvent, responseHeaders, responseCode: 200 };
  }

  private filepathVariants({ url, filename, guid }: FilepathVariantsOptions) {
    // TODO configurable default Downloads directory
    const urlFilename = path.basename(new URL(url).pathname);
    const filenameVariants: Record<string, string> = { urlFilename };
    if (filename) {
      filenameVariants.filename = filename;
      if (filename.trim() !== filename) {
        filenameVariants.trimmed = filename.trim();
      }
    }
    let key: keyof typeof filenameVariants;
    for (key in filenameVariants) {
      if (/\.jpg\s*$/i.test(filenameVariants[key])) {
        filenameVariants[`${key}.jpeg`] = filenameVariants[key].replace(
          /\.jpg(\s*)$/i,
          '.jpeg$1'
        );
      }
      if (/\?+/.test(filenameVariants[key])) {
        filenameVariants[`${key} Unicode encoding error`] = filenameVariants[
          key
        ].replace(/\?/g, '_');
      }
    }
    const dirVariants: Record<string, string> = {
      tmp: path.join(TEMP, guid)
    };
    for (key in filenameVariants) {
      dirVariants[`download ${key}`] = path.join(
        DOWNLOADS,
        filenameVariants[key]
      );
    }
    return dirVariants;
  }

  public async quit() {
    if (this.preparing.isLocked()) {
      await this.preparing.acquire();
      this.preparing.release();
    }
    await this.parent.browser().close();
  }
}
