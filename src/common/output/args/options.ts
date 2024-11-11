import cli from '@battis/qui-cli';

export const options = {
  outputPath: {
    short: 'o',
    description: `Path to output directory or file to save command output (include placeholder ${cli.colors.quotedValue('"%TIMESTAMP%"')} to specify its location, otherwise it is added automatically when needed to avoid overwriting existing files)`
  }
};
