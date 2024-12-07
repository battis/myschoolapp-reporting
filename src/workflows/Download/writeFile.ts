import cli from '@battis/qui-cli';
import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { finished } from 'node:stream/promises';
import { ReadableStream } from 'node:stream/web';

export async function writeFile(
  fetchUrl: string,
  stream: ReadableStream | Buffer,
  snapshotComponent: object,
  key: keyof typeof snapshotComponent,
  outputPath: string
) {
  let localPath = new URL(fetchUrl).pathname.slice(1);
  cli.log.debug(`Saving ${cli.colors.url(localPath)}`);
  try {
    if (localPath == '') {
      localPath = new URL(fetchUrl).hostname + '/index.html';
    }
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
    cli.log.debug(`Saved ${cli.colors.url(localPath)}`);
  } catch (error) {
    cli.log.error(
      `Error saving ${cli.colors.url(localPath)}: ${cli.colors.error(error)}`
    );
  }
}
