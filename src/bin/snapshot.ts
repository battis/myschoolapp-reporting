#!/usr/bin/env node

import cli from '@battis/qui-cli';
import {
  args,
  captureAllSnapshots,
  captureSnapshot
} from '../commands/snapshot.js';
import * as common from '../common.js';

(async () => {
  let {
    positionals: [url],
    values
  } = cli.init({
    args: {
      requirePositionals: 1,
      ...args
    }
  });

  const {
    puppeteerOptions,
    snapshotOptions,
    all,
    allOptions,
    outputOptions: { outputPath, pretty },
    quit
  } = args.parse(values);

  const page = await common.puppeteer.openURL(url, puppeteerOptions);
  await common.puppeteer.login(page, values);
  values.username = '';
  values.password = '';
  common.puppeteer.renewSession(page);

  let data;

  if (all) {
    data = await captureAllSnapshots(page, {
      ...snapshotOptions,
      ...allOptions
    });
  } else {
    data = await captureSnapshot(page, {
      url,
      ...snapshotOptions
    });
  }

  common.puppeteer.stopRenewingSession();
  if (quit) {
    await page.browser().close();
  }

  common.output.writeJSON(outputPath, data, { pretty, name: 'snapshot' });
})();
