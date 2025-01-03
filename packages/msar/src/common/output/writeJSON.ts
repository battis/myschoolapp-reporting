import cli from '@battis/qui-cli';
import path from 'node:path';
import { avoidOverwrite } from './avoidOverwrite.js';
import { writeRecursive } from './writeRecursive.js';

export async function writeJSON(
  outputPath: string | undefined,
  data: object | undefined,
  { pretty = false } = {}
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
      cli.log.debug(`Wrote JSON to ${cli.colors.url(filePath)}`);
    } else {
      cli.log.info(data);
    }
  } else {
    cli.log.warning('No data to write');
  }
}
