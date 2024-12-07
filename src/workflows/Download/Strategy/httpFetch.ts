import cli from '@battis/qui-cli';
import contentDisposition from 'content-disposition';
import path from 'node:path';
import { ReadableStream } from 'node:stream/web';
import * as Cache from '../Cache.js';
import { writeFile } from '../writeFile.js';
import { DownloadStrategy } from './DownloadStrategy.js';

export const httpFetch: DownloadStrategy = async (
  fetchUrl: string,
  snapshotComponent: object,
  key: keyof typeof snapshotComponent,
  _: string,
  outputPath: string
) => {
  cli.log.debug(`Directly fetching ${cli.colors.url(snapshotComponent[key])}`);
  const response = await fetch(fetchUrl);
  if (response.ok && response.body) {
    await writeFile(
      fetchUrl,
      response.body as ReadableStream,
      snapshotComponent,
      key,
      outputPath
    );
    let filename = path.basename(new URL(fetchUrl).pathname);
    const value = response.headers.get('Content-Disposition');
    if (value) {
      try {
        filename =
          contentDisposition.parse(value).parameters?.filename || filename;
      } catch (error) {
        cli.log.debug({
          fetchUrl,
          'Content-Disposition': value,
          strategy: 'httpFetch',
          error
        });
        filename = path.basename(new URL(fetchUrl).pathname);
      }
    }
    return new Cache.Item(snapshotComponent, key, fetchUrl, filename);
  } else {
    throw new Error(`${response.status}: ${response.statusText}`);
  }
};
