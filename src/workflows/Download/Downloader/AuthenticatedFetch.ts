import cli from '@battis/qui-cli';
import { Mutex } from 'async-mutex';
import EventEmitter from 'node:events';
import fs from 'node:fs';
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

export type Options = PrepareOptions & {
  outputPath: string;
};

const TEMP = path.join('/tmp/msar/download', crypto.randomUUID());

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

  public async download(url: string) {
    if (this.preparing.isLocked()) {
      await this.preparing.acquire();
      this.preparing.release();
    }
    const page = await this.parent.browser().newPage();
    const client = await page.createCDPSession();
    let filename: string | undefined = undefined;

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
        if (requestPausedEvent.request.url === url) {
          filename = filenameFromDisposition({
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
          const tempFilepath = path.join(TEMP, downloadEvent.guid);
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
            fs.renameSync(tempFilepath, destFilepath);
            cli.log.debug(`Moved temp file to ${cli.colors.url(localPath)}`);
            this.emit(url, { localPath, filename });
          } catch (_) {
            try {
              const downloadFilepath = path.join(
                process.env.HOME!,
                'Downloads',
                filename!
              );
              fs.renameSync(downloadFilepath, destFilepath);
              cli.log.debug(
                `Moved downloaded file to ${cli.colors.url(localPath)}`
              );
              this.emit(url, { localPath, filename });
            } catch (error) {
              cli.log.error(`Download failed: ${cli.colors.error(error)}`);
              this.emit(url, { error });
            }
          }
        }
      }).bind(this)
    );

    if (!fs.existsSync(TEMP)) {
      fs.mkdirSync(TEMP, { recursive: true });
    }
    client.send('Browser.setDownloadBehavior', {
      behavior: 'allowAndName',
      downloadPath: TEMP,
      eventsEnabled: true
    });

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

  public async quit() {
    await this.parent.close();
  }
}
