import cli from '@battis/qui-cli';
import path from 'node:path';
import { AddSequence, avoidOverwrite } from './avoidOverwrite.js';
import { writeRecursive } from './writeRecursive.js';

export async function writeJSON(
  outputPath: string | undefined,
  data: object | undefined,
  { pretty = false } = {}
) {
  const spinner = cli.spinner();
  if (data) {
    if (outputPath) {
      spinner.start('Writing output to file');
      const filePath = await avoidOverwrite(
        path.resolve(process.cwd(), outputPath)
      );
      writeRecursive(
        filePath,
        pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data)
      );
      spinner.succeed(`Wrote ${cli.colors.url(filePath)}`);
    } else {
      cli.log.info(data);
    }
  } else {
    spinner.warn('No data to write');
  }
}
