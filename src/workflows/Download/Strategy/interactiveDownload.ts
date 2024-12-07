import cli from '@battis/qui-cli';
import { Mutex } from 'async-mutex';
import contentDisposition from 'content-disposition';
import mime from 'mime';
import crypto from 'node:crypto';
import events from 'node:events';
import fs from 'node:fs';
import path from 'node:path';
import { Page } from 'puppeteer';
import * as common from '../../../common.js';
import * as Cache from '../Cache.js';
import { writeFile } from '../writeFile.js';
import { DownloadStrategy } from './DownloadStrategy.js';

let parent: Page | undefined = undefined;
const loggingIn = new Mutex();
let loginCredentials = {};
const TEMP = path.join('/tmp/msar/download', crypto.randomUUID());
const ready = new events.EventEmitter();
let active = 0;

export function setLoginCredentials(credentials = {}) {
  loginCredentials = credentials;
}

async function getPage(host: string) {
  await loggingIn.acquire();
  if (!parent) {
    parent = await common.puppeteer.openURL(`https://${host}`);
    await common.puppeteer.login(parent, loginCredentials);
  }
  loggingIn.release();
  return parent;
}

export async function quit() {
  cli.log.debug(`Quitting`);
  if (fs.existsSync(TEMP)) {
    const tmpContents = fs.readdirSync(TEMP);
    if (tmpContents.length > 0) {
      throw new Error(
        `${tmpContents.length} files abandoned in the temporary directory ${cli.colors.url(TEMP)}`
      );
    }
    fs.rmdirSync(TEMP);
  }
  if (parent) {
    if (active) {
      throw new Error(`${active} downloads still in process`);
    }
    await parent.close();
  }
  cli.log.debug('Chrome closed');
}

export const interactiveDownload: DownloadStrategy = async (
  fetchUrl: string,
  snapshotComponent: object,
  key: keyof typeof snapshotComponent,
  host: string,
  outputPath: string
) => {
  cli.log.debug(
    `Navigating JavaScript authentication to download ${cli.colors.url(snapshotComponent[key])}`
  );
  active += 1;
  const ext = path.extname(fetchUrl).slice(1);
  return new Promise(async (resolve) => {
    let filename = path.basename(new URL(fetchUrl).pathname);
    const page = await (await getPage(host)).browser().newPage();
    let result: Cache.Item;

    // use Chrome DevTools Protocol to rewrite content-disposition header for PDFs
    // https://stackoverflow.com/a/63232618
    // https://github.com/subwaymatch/cdp-modify-response-example
    const client = await page.createCDPSession();
    await client.send('Fetch.enable', {
      patterns: [
        {
          urlPattern: '*',
          requestStage: 'Response'
        }
      ]
    });
    client.on('Fetch.requestPaused', async (reqEvent) => {
      const { requestId } = reqEvent;

      let responseHeaders = reqEvent.responseHeaders || [];
      const contentType = responseHeaders.find(
        (header) => header.name.toLowerCase() === 'content-type'
      )?.value;
      const dispositionIndex = responseHeaders.findIndex(
        (header) => header.name.toLowerCase() === 'content-disposition'
      );
      const disposition =
        dispositionIndex >= 0
          ? responseHeaders[dispositionIndex].value
          : undefined;

      if (disposition) {
        try {
          filename =
            contentDisposition.parse(disposition).parameters?.filename ||
            filename;
        } catch (error) {
          cli.log.debug({
            fetchUrl,
            'Content-Disposition': disposition,
            strategy: 'interactiveDownload',
            error
          });
          filename = path.basename(new URL(fetchUrl).pathname);
        }
      }

      if (contentType?.endsWith('pdf') || contentType?.endsWith('xml')) {
        const attachmentDisposition = {
          name: 'content-disposition',
          value: (disposition || 'attachment').replace('inline', 'attachment')
        };
        if (dispositionIndex >= 0) {
          responseHeaders[dispositionIndex] = attachmentDisposition;
        } else {
          responseHeaders.push(attachmentDisposition);
        }
        const responseObj = await client.send('Fetch.getResponseBody', {
          requestId
        });

        await client.send('Fetch.fulfillRequest', {
          requestId,
          responseCode: 200,
          responseHeaders,
          body: responseObj.body
        });
      } else {
        await client.send('Fetch.continueRequest', { requestId });
      }
    });

    page.on('response', async (response) => {
      if (mime.getAllExtensions(response.headers()['content-type'])?.has(ext)) {
        try {
          await writeFile(
            fetchUrl,
            await response.buffer(),
            snapshotComponent,
            key,
            outputPath
          );
          result = new Cache.Item(snapshotComponent, key, fetchUrl, filename);
          ready.emit(fetchUrl);
        } catch (error) {
          cli.log.debug(`Ignored: ${cli.colors.error(error)} (${fetchUrl})`);
        }
      }
    });

    /*
     * Actual 'file downloads' turn out to be messy because of Chrome's
     * behavior:
     *
     * It opens the download in a new tab, then closes that tab as soon as the
     * file is added to the download queue. The approach is to direct these
     * downloads to a known folder, and rename them with their download GUID,
     * so that they can be retrieved upon completion.
     */
    if (!fs.existsSync(TEMP)) {
      fs.mkdirSync(TEMP, { recursive: true });
    }
    client.send('Browser.setDownloadBehavior', {
      behavior: 'allowAndName',
      downloadPath: TEMP,
      eventsEnabled: true
    });

    client.on('Browser.downloadProgress', (downloadEvent) => {
      if (downloadEvent.state === 'completed') {
        const tempFilepath = path.join(TEMP, downloadEvent.guid);
        const destFilepath = path.resolve(
          process.cwd(),
          common.output.filePathFromOutputPath(
            outputPath,
            new URL(fetchUrl).pathname
          )!
        );
        const dir = path.dirname(destFilepath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.renameSync(tempFilepath, destFilepath);
        result = new Cache.Item(snapshotComponent, key, fetchUrl, filename);
        ready.emit(fetchUrl);
      }
    });

    ready.on(fetchUrl, async () => {
      await page.waitForNetworkIdle();
      await page.close();
      active -= 1;
      resolve(result);
    });

    // _vital_ comment!
    // https://stackoverflow.com/questions/56254177/open-puppeteer-with-specific-configuration-download-pdf-instead-of-pdf-viewer#comment114412241_63232618
    try {
      await page.goto(fetchUrl);
    } catch (error) {
      cli.log.debug(`Ignored: ${cli.colors.error(error)}`);
    }
  });
};
