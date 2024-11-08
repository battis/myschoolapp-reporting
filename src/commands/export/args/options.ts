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
  }
};
