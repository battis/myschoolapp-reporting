#!/usr/bin/env node

import cli from '@battis/qui-cli';
import path from 'node:path';
import commonFlags from '../common/args/flags.js';
import commonOptions from '../common/args/options.js';
import login from '../common/login.js';
import openURL from '../common/openURL.js';
import writeJSON from '../common/writeJSON.js';
import download from './export/download.js';
import captureSnapshot from './snapshot/Snapshot.js';
import snapshotFlags from './snapshot/args/flags.js';
import snapshotOptions from './snapshot/args/options.js';

(async () => {
  let {
    positionals: [url],
    values
  } = cli.init({
    args: {
      requirePositionals: 1,
      flags: { ...commonFlags, ...snapshotFlags },
      options: { ...commonOptions, ...snapshotOptions }
    }
  });

  let {
    outputPath,
    //groupsPath,
    //association,
    //termsOffered,
    format = 'json',
    contextLabelId,
    editMode,
    active,
    future,
    expired,
    fromDate,
    toDate
  } = values;
  const params = new URLSearchParams({
    format,
    contextLabelId,
    editMode,
    active,
    future,
    expired,
    fromDate,
    toDate
  });
  const host = new URL(url).host;
  const headless = !!values.headless;
  //const all = !!values.all;
  const bulletinBoard = !!values.bulletinBoard;
  const topics = !!values.topics;
  const gradebook = !!values.gradebook;
  //const batchSize = parseInt(values.batchSize);
  const width = parseInt(values.viewportWidth);
  const height = parseInt(values.viewportHeight);
  const pretty = !!values.pretty;
  const quit = !!values.quit;
  const page = await openURL(url, {
    headless: !!(headless && values.username && values.password),
    defaultViewport: { width, height }
  });

  await login(page, values);

  const snapshot = await captureSnapshot(page, {
    url,
    bulletinBoard,
    topics,
    gradebook,
    params
  });

  if (snapshot) {
    await download(snapshot, outputPath, { host, pathToComponent: 'Snapshot' });
  }

  if (quit) {
    await page.browser().close();
  }

  writeJSON(path.join(outputPath, 'index.json'), snapshot, { pretty });
})();
