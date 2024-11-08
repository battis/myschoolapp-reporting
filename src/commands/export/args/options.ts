import cli from '@battis/qui-cli';
import path from 'node:path';
import commonOptions from '../../../common/args/options.js';
import options from '../../snapshot/args/options.js';

const defaultOutputPath = path.join(
  process.cwd(),
  `${new Date().toISOString().replace(/[:/.]/g, '-')}-export`
);

export default {
  ...options,
  outputPath: {
    ...commonOptions.outputPath,
    description: `${commonOptions.outputPath.description} (defaults to timestamped export directory, ${cli.colors.quotedValue(`"${defaultOutputPath}"`)})`,
    default: defaultOutputPath
  },
  include: {
    description: `Comma-separated list of regular expressions to match URLs to be included in download (e.g. ${cli.colors.quotedValue('"^\\/,example\\.com"')}, default ${cli.colors.quotedValue('"^\\/"')})`,
    default: '^\\/'
  },
  exclude: {
    description: `Comma-separated list of regular expressions to match URLs to exclude from download (e.g. ${cli.colors.quotedValue('"example\\.com,foo\\..+\\.com"')}, default: ${cli.colors.value('undefined')})`
  }
};
