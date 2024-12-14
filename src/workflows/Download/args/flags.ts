import cli from '@battis/qui-cli';
import * as common from '../../../common.js';

export const flags = {
  ...common.args.pickFlags({ SkyAPI: false }),
  haltOnError: {
    description: `Halt on an error downloading a supporting file (default: ${cli.colors.value('false')}`
  }
};
