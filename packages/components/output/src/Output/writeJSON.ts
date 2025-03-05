import { Colors } from '@battis/qui-cli.colors';
import { Log } from '@battis/qui-cli.log';
import path from 'node:path';
import { avoidOverwrite } from './avoidOverwrite.js';
import * as Storage from './Storage.js';
import { writeRecursive } from './writeRecursive.js';

export async function writeJSON(
  outputPath: string | undefined,
  data: object | undefined,
  { pretty = Storage.pretty(), silent = false } = {}
) {
  if (data) {
    if (outputPath) {
      const filePath = await avoidOverwrite(
        path.resolve(process.cwd(), outputPath)
      );
      writeRecursive(
        filePath,
        pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data)
      );
      const message = `Wrote JSON to ${Colors.url(filePath)}`;
      if (silent) {
        Log.debug(message);
      } else {
        Log.info(message);
      }
    } else {
      Log.info(data);
    }
  } else {
    Log.warning('No data to write');
  }
}
