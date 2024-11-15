import cli from '@battis/qui-cli';
import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { finished } from 'node:stream/promises';
import { ReadableStream } from 'node:stream/web';
import * as common from '../../common.js';
import * as Snapshot from '../Snapshot.js';

const cache: Record<string, string> = {};

type SupportingFilesOptions = {
  pretty?: boolean;
  include?: RegExp[];
  exclude?: RegExp[];
};

type DownloadOptions = {
  host: string;
  pathToComponent: string;
  include?: RegExp[];
  exclude?: RegExp[];
};

export async function supportingFiles(
  snapshot: Snapshot.Data,
  outputPath: string,
  { pretty = false, ...options }: SupportingFilesOptions
) {
  const spinner = cli.spinner();
  if (snapshot) {
    spinner.start('Downloading course content');
    if (fs.existsSync(outputPath)) {
      outputPath = path.join(
        outputPath,
        `${common.output.pathsafeTimestamp()}-${Snapshot.isApiError(snapshot.SectionInfo) ? 'export' : `${snapshot.SectionInfo.Id}_${snapshot.SectionInfo.GroupName.replace(/[^a-z0-9]+/gi, '_')}`}`
      );
    }
    await download(snapshot, outputPath, {
      host: snapshot.Metadata.Host,
      ...options,
      pathToComponent: path.basename(outputPath)
    });
    common.output.writeJSON(path.join(outputPath, 'index.json'), snapshot, {
      pretty
    });
    spinner.succeed(
      `${Snapshot.isApiError(snapshot.SectionInfo) ? 'Course' : `${snapshot.SectionInfo.GroupName} (ID ${snapshot.SectionInfo.Id})`} exported to ${cli.colors.url(outputPath)}`
    );
  } else {
    spinner.fail('Could not downlod course content (no index available)');
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
        if (typeof snapshotComponent[key] === 'object') {
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
                  // FIXME not clear that this is working for the ftp downloads
                  await finished(
                    Readable.fromWeb(response.body as ReadableStream<any>).pipe(
                      fs.createWriteStream(streamPath)
                    )
                  );

                  (snapshotComponent[key] as any) = {
                    original: snapshotComponent[key],
                    localPath
                  };
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
