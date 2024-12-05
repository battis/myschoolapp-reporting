import cli from '@battis/qui-cli';
import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { finished } from 'node:stream/promises';
import { ReadableStream } from 'node:stream/web';
import * as cache from './cache.js';

export async function writeFile(
  fetchUrl: string,
  stream: ReadableStream | Buffer,
  snapshotComponent: object,
  key: keyof typeof snapshotComponent,
  outputPath: string
) {
  const spinner = cli.spinner();
  let localPath = new URL(fetchUrl).pathname.slice(1);
  spinner.start(`Saving ${cli.colors.url(localPath)}`);
  if (localPath == '') {
    localPath = new URL(fetchUrl).hostname + '/index.html';
  }
  await cache.set(snapshotComponent[key], localPath);
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
