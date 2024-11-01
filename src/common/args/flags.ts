import cli from '@battis/qui-cli';

export default {
  headless: {
    description: `Run Puppeteer's Chrome instance headless (default:${cli.colors.value('true')})`,
    default: true
  },
  quit: {
    description: `Quit Puppeteer's Chrome instance on successful completion (default: ${cli.colors.value('true')})`,
    default: true
  }
};
