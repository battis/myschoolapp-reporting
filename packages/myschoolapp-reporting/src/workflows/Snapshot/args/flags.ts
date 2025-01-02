import cli from '@battis/qui-cli';
import * as common from '../../../common.js';

// TODO add --no-student-data flag
export const flags = {
  ...common.args.flags,
  all: {
    short: 'A',
    description: `Capture all sections (default: ${cli.colors.value('false')}, positional argument ${cli.colors.value(`arg0`)} is used to identify MySchoolApp instance)`,
    default: false
  },
  active: {
    description: `Show currently active items (default: ${cli.colors.value('true')})`,
    default: true
  },
  future: {
    description: `Show future items (default: ${cli.colors.value('false')})`,
    default: false
  },
  expired: {
    description: `Show expired items (default: ${cli.colors.value('false')})`,
    default: false
  },
  bulletinBoard: {
    description: `Include the course Bulletin Board in the snapshot (default ${cli.colors.value('true')})`,
    short: 'b',
    default: true
  },
  topics: {
    description: `Include the course Topics in the snapshot (default ${cli.colors.value('true')})`,
    short: 't',
    default: true
  },
  assignments: {
    short: 'a',
    description: `Include the course Assignments in the snapshot (default ${cli.colors.value('true')}, requires ${common.oxfordComma(
      Object.keys(common.SkyAPI.args.options).map((option) =>
        cli.colors.value(`--${option}`)
      )
    )} options set)`,
    default: true
  },
  gradebook: {
    description: `Include the course Gradebook in the snapshot (default ${cli.colors.value('true')})`,
    short: 'g',
    default: true
  },
  studentData: {
    description: `Include student data in the course snapshot (default ${cli.colors.value('false')}, i.e. ${cli.colors.value('--no-studentData')} which preempts any other flags that have been set)`,
    default: false
  },
  ignoreErrors: {
    description: `Continue collecting snapshots even if errors are encountered (default: ${cli.colors.value('true')}, use ${cli.colors.value('--no-ignoreErrors')} to halt on errors)`,
    default: true
  }
};
