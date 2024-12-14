import cli from '@battis/qui-cli';
import path from 'node:path';
import * as common from '../../../common.js';

const defaultOutputPath = path.join(
  process.cwd(),
  `${new Date().toISOString().replace(/[:/.]/g, '-')}-export`
);

export const options = {
  ...common.args.pickOptions({ SkyAPI: false }),
  outputPath: {
    ...common.args.options.outputPath,
    description: `${common.args.options.outputPath?.description} (defaults to the name of the snapshot file)`,
    default: defaultOutputPath
  },
  include: {
    description: `Comma-separated list of regular expressions to match URLs to be included in download (e.g. ${cli.colors.quotedValue('"^\\/,example\\.com"')}, default ${cli.colors.quotedValue('"^\\/"')} to include only URLs on Blackbaud's servers)`,
    default: '^\\/'
  },
  exclude: {
    description: `Comma-separated list of regular expressions to match URLs to exclude from download (e.g. ${cli.colors.quotedValue('"example\\.com,foo\\..+\\.com"')}, default: ${cli.colors.value('undefined')})`
  }
};
