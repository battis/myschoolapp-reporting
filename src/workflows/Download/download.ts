import cli from '@battis/qui-cli';
import { Mutex } from 'async-mutex';
import contentDisposition from 'content-disposition';
import mime from 'mime';
import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { finished } from 'node:stream/promises';
import { ReadableStream } from 'node:stream/web';
import { Page } from 'puppeteer';
import * as common from '../../common.js';
import * as Snapshot from '../Snapshot.js';

type BaseOptions = {
  include?: RegExp[];
  exclude?: RegExp[];
};

type SupportingFilesOptions = BaseOptions & {
  pretty?: boolean;
  loginCredentials?: {
    username?: string;
    password?: string;
    sso?: string;
  };
};

type DownloadOptions = BaseOptions & {
  host: string;
  pathToComponent: string;
};

/*
 * FIXME ditch the cache and use a map and semaphores
 * It's probably more efficient to spider an index and discover all the files
 * that need to be downloaded, build a list of all the places every file needs
 * to go... and then queue all the downloads and apply those mappings. At the
 * moment, we're getting a race condition where all the files are being
 * downloaded and the cache is ignored anyway.
 */
// FIXME sort out download paths so that cached files can be reused across courses
const cache: Record<string, string> = {};
let page: Page | undefined = undefined;
const loggingIn = new Mutex();
let loginCredentials = {};
const spinner = cli.spinner();

async function getPage(host: string) {
  await loggingIn.acquire();
  if (!page) {
    page = await common.puppeteer.openURL(`https://${host}`);
    await common.puppeteer.login(page, loginCredentials);
  }
  loggingIn.release();
  return page;
}

export async function supportingFiles(
  snapshot: Snapshot.Data,
  outputPath: string,
  {
    pretty = false,
    loginCredentials: lc = {},
    ...options
  }: SupportingFilesOptions
) {
  loginCredentials = lc;
  if (snapshot) {
    spinner.start('Downloading course content');
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }
    await download(snapshot, outputPath, {
      host: snapshot.Metadata.Host,
      ...options,
      pathToComponent: path.basename(outputPath)
    });
    const indexName = Snapshot.isApiError(snapshot.SectionInfo)
      ? 'index.json'
      : `${snapshot.SectionInfo.Id}.json`;
    await common.output.writeJSON(
      await common.output.avoidOverwrite(path.join(outputPath, indexName)),
      snapshot,
      {
        pretty
      }
    );
    spinner.succeed(
      `${Snapshot.isApiError(snapshot.SectionInfo) ? 'Course' : `${snapshot.SectionInfo.GroupName} (ID ${snapshot.SectionInfo.Id})`} exported to ${cli.colors.url(outputPath)}/${cli.colors.value(indexName)}`
    );
    return indexName;
  } else {
    spinner.fail('Could not downlod course content (no index available)');
    return undefined;
  }
}

async function download(
  snapshotComponent: object,
  outputPath: string,
  { host, pathToComponent, include, exclude }: DownloadOptions
) {
  if (Array.isArray(snapshotComponent)) {
    await Promise.allSettled(
      snapshotComponent.map(async (elt, i) => {
        await download(elt, outputPath, {
          host,
          pathToComponent: `${pathToComponent}[${i}]`,
          include,
          exclude
        });
      })
    );
  } else {
    await Promise.allSettled(
      (
        Object.keys(snapshotComponent) as (keyof typeof snapshotComponent)[]
      ).map(async (key: keyof typeof snapshotComponent) => {
        if (snapshotComponent[key] === null) {
          return;
        } else if (typeof snapshotComponent[key] === 'object') {
          await download(snapshotComponent[key], outputPath, {
            host,
            pathToComponent: `${pathToComponent}.${key}`,
            include,
            exclude
          });
        } else if (/Url$/.test(key)) {
          if (
            snapshotComponent[key] &&
            (!include ||
              include.reduce(
                (included, regex) =>
                  included || regex.test(snapshotComponent[key]),
                false
              )) &&
            (!exclude ||
              exclude.reduce(
                (excluded, regex) =>
                  excluded && !regex.test(snapshotComponent[key]),
                true
              ))
          ) {
            (snapshotComponent[key] as any) = await getFile(
              snapshotComponent,
              key,
              host,
              outputPath
            );
          }
        }
      })
    );
  }
}

async function getFile(
  snapshotComponent: object,
  key: keyof typeof snapshotComponent,
  host: string,
  outputPath: string
) {
  spinner.start(`Getting ${cli.colors.url(snapshotComponent[key])}`);
  let filename = path.basename(snapshotComponent[key]);
  let localPath = cache[snapshotComponent[key]];
  if (!localPath) {
    spinner.start(`Downloading ${cli.colors.url(snapshotComponent[key])}`);
    let fetchUrl: string = snapshotComponent[key];
    if (fetchUrl.slice(0, 2) == '//') {
      fetchUrl = `https:${fetchUrl}`;
    } else if (fetchUrl.slice(0, 1) == '/') {
      fetchUrl = `https://${host}${fetchUrl}`;
    }
    if (/myschoolcdn\.com\/.+\/video\//.test(fetchUrl)) {
      fetchUrl = fetchUrl.replace(
        /(\/\d+)\/video\/video\d+_(\d+)\.(.+)/,
        '$1/$2/1/video.$3'
      );
    }
    filename = path.basename(fetchUrl);
    try {
      if (/ftpimages/.test(fetchUrl)) {
        filename = await downloadFile(
          fetchUrl,
          snapshotComponent,
          key,
          host,
          outputPath
        );
      } else {
        filename = await fetchFile(
          fetchUrl,
          snapshotComponent,
          key,
          outputPath
        );
      }
      spinner.succeed(`Downloaded ${cli.colors.url(fetchUrl)}`);
    } catch (error) {
      spinner.fail(
        `Error getting ${cli.colors.url(snapshotComponent[key])}: ${cli.colors.error(error)}`
      );
    }
  } else {
    spinner.succeed(`Using cached ${cli.colors.url(snapshotComponent[key])}`);
  }
  return {
    original: snapshotComponent[key],
    localPath,
    filename
  };
}

async function fetchFile(
  fetchUrl: string,
  snapshotComponent: object,
  key: keyof typeof snapshotComponent,
  outputPath: string
) {
  spinner.start(`Directly fetching ${cli.colors.url(snapshotComponent[key])}`);
  const response = await fetch(fetchUrl);
  if (response.ok && response.body) {
    await save(
      fetchUrl,
      response.body as ReadableStream,
      snapshotComponent,
      key,
      outputPath
    );
    return contentDisposition.parse(
      response.headers.get('Content-Disposition') || ''
    ).parameters?.filename;
  } else {
    throw new Error(`${response.status}: ${response.statusText}`);
  }
}

async function downloadFile(
  fetchUrl: string,
  snapshotComponent: object,
  key: keyof typeof snapshotComponent,
  host: string,
  outputPath: string
) {
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
          await save(
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
    client.send('Browser.setDownloadBehavior', {
      behavior: 'allowAndName',
      downloadPath: common.output.filePathFromOutputPath(outputPath, 'tmp'),
      eventsEnabled: true
    });

    client.on('Browser.downloadProgress', (downloadEvent) => {
      if (downloadEvent.state === 'completed') {
        const tempFilepath = path.resolve(
          process.cwd(),
          common.output.filePathFromOutputPath(outputPath, 'tmp')!,
          downloadEvent.guid
        );
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

async function save(
  fetchUrl: string,
  stream: ReadableStream | Buffer,
  snapshotComponent: object,
  key: keyof typeof snapshotComponent,
  outputPath: string
) {
  let localPath = new URL(fetchUrl).pathname.slice(1);
  spinner.start(`Saving ${cli.colors.url(localPath)}`);
  if (localPath == '') {
    localPath = new URL(fetchUrl).hostname + '/index.html';
  }
  cache[snapshotComponent[key]] = localPath;
  const streamPath = path.resolve(process.cwd(), outputPath, localPath);
  fs.mkdirSync(path.dirname(streamPath), {
    recursive: true
  });
  if (stream instanceof Buffer) {
    fs.writeFileSync(streamPath, stream);
  } else {
    await finished(
      Readable.fromWeb(stream as ReadableStream).pipe(
        fs.createWriteStream(streamPath)
      )
    );
  }
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
  if (page) {
    waitForTabs();
  }
}
