import cli from '@battis/qui-cli';
import { Mutex } from 'async-mutex';
import contentDisposition from 'content-disposition';
import mime from 'mime';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { Page } from 'puppeteer';
import * as common from '../../common.js';
import { writeFile } from './writeFile.js';

let page: Page | undefined = undefined;
const loggingIn = new Mutex();
let loginCredentials = {};
const TEMP = path.join('/tmp/msar/download', crypto.randomUUID());

export function setLoginCredentials(credentials = {}) {
  loginCredentials = credentials;
}

async function getPage(host: string) {
  await loggingIn.acquire();
  if (!page) {
    page = await common.puppeteer.openURL(`https://${host}`);
    await common.puppeteer.login(page, loginCredentials);
  }
  loggingIn.release();
  return page;
}

async function waitForTabs() {
  if (page) {
    if ((await page.browser().pages()).length == 1) {
      await page.browser().close();
    } else {
      setTimeout(waitForTabs, 100);
    }
  }
}

export async function quit() {
  if (fs.existsSync(TEMP)) {
    const tmpContents = fs.readdirSync(TEMP);
    if (tmpContents.length > 0) {
      throw new Error(
        `${tmpContents.length} files abandoned in the temporary directory ${cli.colors.url(TEMP)}`
      );
    }
    fs.rmdirSync(TEMP);
  }
  if (page) {
    waitForTabs();
  }
}

export async function interactiveDownload(
  fetchUrl: string,
  snapshotComponent: object,
  key: keyof typeof snapshotComponent,
  host: string,
  outputPath: string
) {
  const spinner = cli.spinner();
  spinner.start(
    `Navigating JavaScript authentication to download ${cli.colors.url(snapshotComponent[key])}`
  );
  const ext = path.extname(fetchUrl).slice(1);
  return new Promise<string>(async (resolve, reject) => {
    let filename = path.basename(fetchUrl);
    const downPage = await (await getPage(host)).browser().newPage();

    // use Chrome DevTools Protocol to rewrite content-disposition header for PDFs
    // https://stackoverflow.com/a/63232618
    // https://github.com/subwaymatch/cdp-modify-response-example
    const client = await downPage.target().createCDPSession();
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
      let contentType = responseHeaders.findIndex(
        (header) => header.name.toLowerCase() === 'content-type'
      );
      let disposition = responseHeaders.findIndex(
        (header) => header.name.toLowerCase() === 'content-disposition'
      );

      if (disposition >= 0) {
        filename =
          contentDisposition.parse(responseHeaders[disposition].value)
            .parameters?.filename || filename;
      }

      if (
        contentType >= 0 &&
        (responseHeaders[contentType].value.endsWith('pdf') ||
          responseHeaders[contentType].value.endsWith('xml'))
      ) {
        responseHeaders.push({
          name: 'content-disposition',
          value: 'attachment'
        });

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

    downPage.on('response', async (response) => {
      if (mime.getAllExtensions(response.headers()['content-type'])?.has(ext)) {
        try {
          await writeFile(
            fetchUrl,
            await response.buffer(),
            snapshotComponent,
            key,
            outputPath
          );
          resolve(filename);
        } catch (error) {
          cli.log.debug({
            warning: 'ProtocolError exception was ignored',
            error
          });
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
        resolve(filename);
      }
    });

    // _vital_ comment!
    // https://stackoverflow.com/questions/56254177/open-puppeteer-with-specific-configuration-download-pdf-instead-of-pdf-viewer#comment114412241_63232618
    try {
      await downPage.goto(fetchUrl);
    } catch (error) {
      cli.log.debug({
        warning: 'net::ERR_ABORTED exception was ignored',
        error
      });
    }
    await downPage.bringToFront();
    // TODO this timeout is arbitrary -- should it be configurable?
    await downPage.waitForNetworkIdle({ idleTime: 10000 });
    await downPage.close();
  });
}
