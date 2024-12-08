import cli from '@battis/qui-cli';
import fs from 'node:fs';
import path from 'node:path';
import { CDPSession, Page, Protocol } from 'puppeteer';
import * as common from '../../../../common.js';
import * as Cache from '../../Cache.js';
import { asAttachment } from './asAttachment.js';
import * as AuthenticatedSession from './AuthenticatedSession.js';
import { filenameFromDisposition } from './filenameFromDisposition.js';
import { IQueue } from './IQueue.js';

const TEMP = path.join('/tmp/msar/download', crypto.randomUUID());

export class Downloader {
  private static outputPath?: string;

  public static init({ outputPath }: { outputPath: string }) {
    this.outputPath = outputPath;
  }

  public static async quit() {
    if (fs.existsSync(TEMP)) {
      const tmpContents = fs.readdirSync(TEMP);
      if (tmpContents.length > 0) {
        throw new Error(
          `${tmpContents.length} files abandoned in the temporary directory ${cli.colors.url(TEMP)}`
        );
      }
      fs.rmdirSync(TEMP);
    }
  }

  private _page?: Page;
  private get page() {
    if (!this._page) {
      throw new Error('Downloader Puppeteer page not initialized');
    }
    return this._page;
  }
  private set page(page) {
    this._page = page;
  }

  private _client?: CDPSession;
  private get client() {
    if (!this._client) {
      throw new Error('Downloader CDP client not initialized');
    }
    return this._client;
  }
  private set client(client) {
    this._client = client;
  }

  private _snapshotComponent?: object;
  private set snapshotComponent(snapshotComponent) {
    this._snapshotComponent = snapshotComponent;
  }
  private get snapshotComponent() {
    if (!this._snapshotComponent) {
      throw new Error('Downloader snapshotComponent not initialized');
    }
    return this._snapshotComponent;
  }

  private _key?: keyof typeof this.snapshotComponent;
  private set key(key) {
    this._key = key;
  }
  private get key() {
    if (!this._key) {
      throw new Error('Downloader snapshotComponent not initialized');
    }
    return this._key;
  }

  private _fetchUrl?: string;
  private set fetchUrl(fetchUrl) {
    this._fetchUrl = fetchUrl;
  }
  private get fetchUrl() {
    if (!this._fetchUrl) {
      throw new Error('Downloader fetchUrl not initialized');
    }
    return this._fetchUrl;
  }
  private filename?: string;

  public constructor(private queue: IQueue<Downloader>) {
    AuthenticatedSession.get().then((auth) =>
      auth
        .browser()
        .newPage()
        .then((page) => {
          this.page = page;
          this.prepare();
        })
    );
  }

  private async prepare() {
    if (!this.page) {
      throw new Error('Downloader not initialized');
    }

    this.client = await this.page.createCDPSession();

    await this.client.send('Fetch.enable', {
      patterns: [
        {
          urlPattern: '*',
          requestStage: 'Response'
        }
      ]
    });

    this.client.on(
      'Fetch.requestPaused',
      (async (requestPausedEvent: Protocol.Fetch.RequestPausedEvent) => {
        const { requestId } = requestPausedEvent;
        if (requestPausedEvent.request.url === this.fetchUrl) {
          this.filename = filenameFromDisposition(requestPausedEvent);
          await this.client.send(
            'Fetch.fulfillRequest',
            asAttachment(requestPausedEvent)
          );
        } else {
          await this.client.send('Fetch.continueRequest', { requestId });
        }
      }).bind(this)
    );

    this.client.on(
      'Browser.downloadProgress',
      (async (downloadEvent: Protocol.Browser.DownloadProgressEvent) => {
        if (downloadEvent.state === 'completed') {
          const tempFilepath = path.join(TEMP, downloadEvent.guid);
          const localPath = new URL(this.fetchUrl).pathname;
          const destFilepath = path.resolve(
            process.cwd(),
            common.output.filePathFromOutputPath(
              Downloader.outputPath,
              localPath
            )!
          );
          const dir = path.dirname(destFilepath);
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          try {
            fs.renameSync(tempFilepath, destFilepath);
            cli.log.debug(
              `Moved Chrome download to ${cli.colors.url(localPath)}`
            );
            this.queue.emit(
              this.fetchUrl,
              new Cache.Item(
                this.snapshotComponent,
                this.key,
                this.fetchUrl,
                this.filename
              )
            );
          } catch (error) {
            cli.log.error(`Download failed: ${cli.colors.error(error)}`);
            this.queue.remove(this);
            await this.page.close();
            const url = new URL(this.fetchUrl);
            url.hash = '' + parseInt(url.hash || '0') + 1;
            this.queue.emit(
              this.fetchUrl,
              await this.queue.download(
                url.toString(),
                this.snapshotComponent,
                this.key
              )
            );
          }
        }
      }).bind(this)
    );
    this.queue.enqueue(this);
  }

  public begin(
    fetchUrl: string,
    snapshotComponent: object,
    key: keyof typeof snapshotComponent
  ) {
    this.fetchUrl = fetchUrl;
    this.snapshotComponent = snapshotComponent;
    this.key = key;
    this.page.goto(this.fetchUrl);
  }
}
