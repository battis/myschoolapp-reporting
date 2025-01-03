import cli from '@battis/qui-cli';
import path from 'node:path';
import * as common from '../../../common.js';

export const defaults = {
  outputPath: path.join(
    process.cwd(),
    `${new Date().toISOString().replace(/[:/.]/g, '-')}-export`
  ),
  include: '^\\/'
};

export const options = {
  ...common.Args.options,
  outputPath: {
    ...common.Args.options.outputPath,
    description: `${common.Args.options.outputPath?.description} (defaults to the name of the snapshot file)`,
    default: defaults.outputPath
  },
  include: {
    description: `Comma-separated list of regular expressions to match URLs to be included in download (e.g. ${cli.colors.quotedValue('"^\\/,example\\.com"')}, default ${cli.colors.quotedValue('"^\\/"')} to include only URLs on Blackbaud's servers)`,
    default: defaults.include
  },
  exclude: {
    description: `Comma-separated list of regular expressions to match URLs to exclude from download (e.g. ${cli.colors.quotedValue('"example\\.com,foo\\..+\\.com"')}`
  }
};
