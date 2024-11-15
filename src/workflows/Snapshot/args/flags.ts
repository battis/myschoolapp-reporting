import cli from '@battis/qui-cli';
import * as common from '../../../common.js';

export const flags = {
  ...common.args.flags,
  all: {
    short: 'A',
    description: `Capture all sections (default: ${cli.colors.value('false')}, positional argument is used to identify MySchoolApp instance)`,
    default: false
  },
  editMode: {
    description: '(default: false)',
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
      Object.keys(common.OAuth2.args.options).map((option) =>
        cli.colors.value(option)
      )
    )} options set)`,
    default: true
  },
  gradebook: {
    description: `Include the course Gradebook in the snapshot (default ${cli.colors.value('true')})`,
    short: 'g',
    default: true
  }
};
