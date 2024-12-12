import cli from '@battis/qui-cli';

export const flags = {
  pretty: {
    description: `Pretty print output to file (if ${cli.colors.value('--outputPath')} option is used)`
  }
};
