import cli from '@battis/qui-cli';
import { ReadableStream } from 'node:stream/web';
import * as common from '../../../common.js';
import {
  ContentDisposition,
  filenameFromDisposition
} from '../filenameFromDisposition.js';
import { Strategy } from './Strategy.js';

export type Options = { outputPath: string };

export class HTTPFetch implements Strategy {
  private outputPath: string;

  public constructor({ outputPath }: Options) {
    this.outputPath = outputPath;
  }

  public async download(url: string) {
    cli.log.debug(`Directly fetching ${cli.colors.url(url)}`);
    const response = await fetch(url);
    if (response.ok && response.body) {
      return {
        localPath: await common.output.writeFetchedFile({
          url,
          stream: response.body as ReadableStream,
          outputPath: this.outputPath
        }),
        filename: filenameFromDisposition({
          url,
          value: response.headers.get(ContentDisposition) || undefined
        })
      };
    } else {
      return { error: `${response.status}: ${response.statusText}` };
    }
  }
}
