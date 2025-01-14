import cli from '@battis/qui-cli';
import path from 'node:path';
import * as common from '../../../common.js';

let defaultYear = `${new Date().getFullYear()} - ${new Date().getFullYear() + 1}`;
if (new Date().getMonth() <= 6) {
  defaultYear = `${new Date().getFullYear() - 1} - ${new Date().getFullYear()}`;
}

export const defaults = {
  snapshotOptions: {
    payload: {
      fromDate: new Date().toLocaleDateString('en-US'),
      contextLabelId: 2
    }
  },
  allOptions: {
    year: defaultYear
  }
};

export const options = {
  ...common.Args.options,
  outputPath: {
    ...common.Args.options.outputPath,
    description: common.Args.options.outputPath?.description
      .replace(
        common.Args.defaults.outputOptions.outputPath,
        path.resolve(
          process.cwd(),
          common.Args.defaults.outputOptions.outputPath,
          ':SnapshotName.json'
        )
      )
      .replace(
        /\)$/,
        ` where ${cli.colors.value(':SnapshotName')} is either the name of the course in ${cli.colors.quotedValue(`":Year - :Teacher - :CourseTitle - :SectionId"`)} format for a single section or group or ${cli.colors.quotedValue(`"snapshot"`)} if the ${cli.colors.value('--all')} flag is set. ${cli.colors.url(':SnapshotName.metadata.json')} is also output, recording the parameters of the snapshot command.)`
      )
  },
  fromDate: {
    description: `Starting date for date-based filter where relevant (default is today's date: ${cli.colors.quotedValue(`"${defaults.snapshotOptions.payload.fromDate}"`)})`,
    default: defaults.snapshotOptions.payload.fromDate
  },
  toDate: {
    description: `ending date for data-based filter where relevant`
  },
  contextLabelId: {
    description: `(default: ${cli.colors.value(defaults.snapshotOptions.payload.contextLabelId)})`,
    default: defaults.snapshotOptions.payload.contextLabelId.toString()
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
  groupsPath: {
    description: `Path to output directory or file to save filtered groups listing (include placeholder ${cli.colors.quotedValue('"%TIMESTAMP%"')} to specify its location, otherwise it is added automatically when needed to avoid overwriting existing files)`
  },
  year: {
    description: `If ${cli.colors.value(`--all`)} flag is used, which year to download. (Default: ${cli.colors.quotedValue(`"${defaults.allOptions.year}"`)})`,
    default: defaults.allOptions.year
  }
};
