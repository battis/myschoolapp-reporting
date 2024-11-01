import cli from '@battis/qui-cli';

export default {
  all: {
    short: 'a',
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
  gradebook: {
    description: `Include the course Gradebook in the snapshot (default ${cli.colors.value('true')})`,
    short: 'g',
    default: true
  },
  pretty: {
    description: `Pretty print output to file (if ${cli.colors.value('output')} is defined)`
  }
};
