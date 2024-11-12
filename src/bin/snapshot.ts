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
    quit,
    tokenPath,
    credentials
  } = args.parse(values);

  const page = await common.puppeteer.openURL(url, puppeteerOptions);
  await common.puppeteer.login(page, values);
  values.username = '';
  values.password = '';
  common.puppeteer.renewSession(page);

  let data;

  if (all) {
    await common.OAuth2.getToken(tokenPath, credentials);
    data = await captureAllSnapshots(page, {
      ...snapshotOptions,
      ...allOptions,
      tokenPath,
      credentials
    });
  } else {
    data = await captureSnapshot(page, {
      url,
      ...snapshotOptions,
      tokenPath,
      credentials
    });
  }

  common.puppeteer.stopRenewingSession();
  if (quit) {
    await page.browser().close();
  }

  common.output.writeJSON(outputPath, data, { pretty, name: 'snapshot' });
})();
