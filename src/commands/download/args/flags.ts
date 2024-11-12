import cli from '@battis/qui-cli';
import * as snapshot from '../../snapshot.js';

const flags = { ...snapshot.args.flags };
flags.gradebook.description = flags.gradebook.description.replace(
  /\(default [^)]+\)/,
  `(default ${cli.colors.value('false')})`
);
flags.gradebook.default = false;

export { flags };
