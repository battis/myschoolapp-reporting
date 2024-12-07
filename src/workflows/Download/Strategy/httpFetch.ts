import cli from '@battis/qui-cli';
import contentDisposition from 'content-disposition';
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
  const spinner = cli.spinner();
  spinner.start(`Directly fetching ${cli.colors.url(snapshotComponent[key])}`);
  const response = await fetch(fetchUrl);
  if (response.ok && response.body) {
    await writeFile(
      fetchUrl,
      response.body as ReadableStream,
      snapshotComponent,
      key,
      outputPath
    );
    return new Cache.Item(
      snapshotComponent,
      key,
      fetchUrl,
      contentDisposition.parse(
        response.headers.get('Content-Disposition') || ''
      ).parameters?.filename
    );
  } else {
    throw new Error(`${response.status}: ${response.statusText}`);
  }
};
