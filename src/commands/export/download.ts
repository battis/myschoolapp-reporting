import cli from '@battis/qui-cli';
import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { finished } from 'node:stream/promises';
import { ReadableStream } from 'node:stream/web';

const cache: Record<string, string> = {};

type Options = {
  host: string;
  pathToComponent: string;
  include?: RegExp[];
  exclude?: RegExp[];
};

export default async function download(
  snapshotComponent: object,
  outputPath: string,
  { host, pathToComponent, include = [], exclude = [] }: Options
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
        if (typeof snapshotComponent[key] === 'object') {
          await download(snapshotComponent[key], outputPath, {
            host,
            pathToComponent: `${pathToComponent}.${key}`,
            include,
            exclude
          });
        } else if (/Url$/.test(key)) {
          if (snapshotComponent[key]) {
            if (cache[snapshotComponent[key]]) {
              (snapshotComponent as any)[`Local${key}`] =
                cache[snapshotComponent[key]];
            } else {
              const spinner = cli.spinner();
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
              try {
                spinner.start(fetchUrl);
                const response = await fetch(fetchUrl);
                if (response.ok && response.body) {
                  let localPath = new URL(fetchUrl).pathname.slice(1);
                  if (localPath == '') {
                    localPath = new URL(fetchUrl).hostname + '/index.html';
                  }
                  cache[snapshotComponent[key]] = localPath;
                  const streamPath = path.resolve(
                    process.cwd(),
                    outputPath,
                    localPath
                  );
                  fs.mkdirSync(path.dirname(streamPath), {
                    recursive: true
                  });
                  await finished(
                    Readable.fromWeb(response.body as ReadableStream<any>).pipe(
                      fs.createWriteStream(streamPath)
                    )
                  );

                  (snapshotComponent as any)[`Local${key}`] = localPath;
                  spinner.succeed(
                    `${pathToComponent}.${key}: ${cli.colors.url(localPath)}`
                  );
                } else {
                  spinner.fail(snapshotComponent[key]);
                }
              } catch (e) {
                spinner.fail(
                  `${cli.colors.error(`${JSON.stringify(e)}:`)} ${cli.colors.url(fetchUrl)}`
                );
              }
            }
          }
        }
      })
    );
  }
}
