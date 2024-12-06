import cli from '@battis/qui-cli';

export const options = {
  outputPath: {
    short: 'o',
    description: `Path to output directory or file to save command output (default: current working directory)`,
    default: '.'
  }
};
