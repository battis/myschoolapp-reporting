import cli from '@battis/qui-cli';
import contentDisposition from 'content-disposition';
import { ReadableStream } from 'node:stream/web';
import { writeFile } from './writeFile.js';

export async function httpFetch(
  fetchUrl: string,
  snapshotComponent: object,
  key: keyof typeof snapshotComponent,
  outputPath: string
) {
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
    return contentDisposition.parse(
      response.headers.get('Content-Disposition') || ''
    ).parameters?.filename;
  } else {
    throw new Error(`${response.status}: ${response.statusText}`);
  }
}
