import cli from '@battis/qui-cli';
import * as common from '../../../common.js';

export const options = {
  ...common.args.options,
  fromDate: {
    description: `Starting date for date-based filter where relevant (default is today's date: ${cli.colors.quotedValue(`"${new Date().toLocaleDateString('en-US')}"`)})`,
    default: new Date().toLocaleDateString('en-US')
  },
  toDate: {
    description: `ending date for data-based filter where relevant (default: ${cli.colors.value('undefined')})`,
    default: ''
  },
  contextLabelId: {
    description: `(default: ${cli.colors.value('2')})`,
    default: '2'
  },
  association: {
    description: `Comma-separated list of group associations to include if ${cli.colors.value('--all')} flag is used. Possible values: ${common.oxfordComma(
      [
        'Activities',
        'Advisories',
        'Classes',
        'Community Groups',
        'Dorms',
        'Teams'
      ].map((assoc) => cli.colors.quotedValue(`"${assoc}"`))
    )}`
  },
  termsOffered: {
    description: `Comma-separated list of terms to include if ${cli.colors.value('--all')} flag is used`
  },
  batchSize: {
    description: `Number of simultaneous requests to batch together (default: ${cli.colors.value(10)})`,
    default: '10'
  },
  groupsPath: {
    description: `Path to output directory or file to save filtered groups listing (include placeholder ${cli.colors.quotedValue('"%TIMESTAMP%"')} to specify its location, otherwise it is added automatically when needed to avoid overwriting existing files)`
  },
  year: {
    description: `If ${cli.colors.value(`--all`)} flag is used, which year to download. (Default: current year)`
  }
};
