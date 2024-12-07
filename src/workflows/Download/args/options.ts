import cli from '@battis/qui-cli';
import path from 'node:path';
import * as common from '../../../common.js';

const defaultOutputPath = path.join(
  process.cwd(),
  `${new Date().toISOString().replace(/[:/.]/g, '-')}-export`
);

export const options = {
  ...common.args.options,
  outputPath: {
    ...common.args.options.outputPath,
    description: `${common.args.options.outputPath.description} (defaults to timestamped export directory, ${cli.colors.quotedValue(`"${defaultOutputPath}"`)})`,
    default: defaultOutputPath
  },
  include: {
    description: `Comma-separated list of regular expressions to match URLs to be included in download (e.g. ${cli.colors.quotedValue('"^\\/,example\\.com"')}, default ${cli.colors.quotedValue('"^\\/"')})`,
    default: '^\\/'
  },
  exclude: {
    description: `Comma-separated list of regular expressions to match URLs to exclude from download (e.g. ${cli.colors.quotedValue('"example\\.com,foo\\..+\\.com"')}, default: ${cli.colors.value('undefined')})`
  },
  retries: {
    description: `Number of times to retry failed file downloads (default: ${cli.colors.value(5)}`,
    default: '5'
  }
};
