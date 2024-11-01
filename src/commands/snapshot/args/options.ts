import cli from '@battis/qui-cli';

export default {
  fromDate: {
    description: `Starting date for date-based filter where relevant (default is today's date: ${cli.colors.quotedValue(`"${new Date().toLocaleDateString('en-US')}"`)})`,
    default: new Date().toLocaleDateString('en-US')
  },
  toDate: {
    description:
      'ending date for data-based filter where relevant (default: none)',
    default: ''
  },
  contextLabelId: {
    description: `(default: ${cli.colors.value('2')})`,
    default: '2'
  },
  association: {
    description: `Comma-separated list of group associations to include if ${cli.colors.value('all')} is defined`
  },
  termsOffered: {
    description: `Comma-separated list of terms to include if ${cli.colors.value('all')} is defined`
  },
  batchSize: {
    description: `Number of simultaneous requests to batch together (default: ${cli.colors.value(20)})`,
    default: '20'
  },
  groupsPath: {
    description: `Path to output directory or file to save filtered groups listing (include placeholder ${cli.colors.quotedValue('"%TIMESTAMP%"')} to specify its location, otherwise it is added automatically when needed to avoid overwriting existing files)`
  }
};
