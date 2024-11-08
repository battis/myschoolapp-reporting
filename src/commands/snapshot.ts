#!/usr/bin/env node

import cli from '@battis/qui-cli';
import commonFlags from '../common/args/flags.js';
import commonOptions from '../common/args/options.js';
import login from '../common/login.js';
import openURL from '../common/openURL.js';
import { renewSession, stopRenewingSession } from '../common/renewSession.js';
import writeJSON from '../common/writeJSON.js';
import flags from './snapshot/args/flags.js';
import options from './snapshot/args/options.js';
import parseArgs from './snapshot/args/parse.js';
import { captureAllSnapshots, captureSnapshot } from './snapshot/Snapshot.js';

(async () => {
  let {
    positionals: [url],
    values
  } = cli.init({
    args: {
      requirePositionals: 1,
      options: {
        ...commonOptions,
        ...options
      },
      flags: {
        ...commonFlags,
        ...flags
      }
    }
  });

  const {
    puppeteerOptions,
    snapshotOptions,
    all,
    allOptions,
    outputOptions: { outputPath, pretty },
    quit
  } = parseArgs(values);

  const page = await openURL(url, puppeteerOptions);
  await login(page, values);
  values.username = '';
  values.password = '';
  renewSession(page);

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

  stopRenewingSession();
  if (quit) {
    await page.browser().close();
  }

  writeJSON(outputPath, data, { pretty, name: 'snapshot' });
})();
