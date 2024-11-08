import cli from '@battis/qui-cli';
import flags from '../../snapshot/args/flags.js';

flags.gradebook.description = flags.gradebook.description.replace(
  /\(default [^)]+\)/,
  `(default ${cli.colors.value('false')})`
);
flags.gradebook.default = false;

export default flags;
