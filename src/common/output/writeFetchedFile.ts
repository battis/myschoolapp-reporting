import cli from '@battis/qui-cli';
import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { finished } from 'node:stream/promises';
import { ReadableStream } from 'node:stream/web';

type Options = {
  url: string;
  stream: ReadableStream | Buffer;
  outputPath: string;
};

export async function writeFetchedFile({ url, stream, outputPath }: Options) {
  let localPath = new URL(url).pathname.slice(1);
  try {
    if (localPath == '') {
      localPath = new URL(url).hostname + '/index.html';
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
    cli.log.debug(
      `Saved ${cli.colors.url(url)} to ${cli.colors.url(localPath)}`
    );
    return localPath;
  } catch (error) {
    throw new Error(
      `Error saving ${cli.colors.url(url)} to ${cli.colors.url(localPath)}: ${cli.colors.error(error)}`
    );
  }
}
