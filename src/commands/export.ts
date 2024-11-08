#!/usr/bin/env node

import cli from '@battis/qui-cli';
import fs from 'node:fs';
import path from 'node:path';
import commonFlags from '../common/args/flags.js';
import commonOptions from '../common/args/options.js';
import login from '../common/login.js';
import openURL from '../common/openURL.js';
import { renewSession, stopRenewingSession } from '../common/renewSession.js';
import flags from './export/args/flags.js';
import options from './export/args/options.js';
import parseArgs from './export/args/parse.js';
import downloadSnapshot from './export/download.js';
import { isApiError } from './snapshot/ApiError.js';
import { captureAllSnapshots, captureSnapshot } from './snapshot/Snapshot.js';

(async () => {
  let {
    positionals: [url],
    values
  } = cli.init({
    args: {
      requirePositionals: 1,
      flags: { ...commonFlags, ...flags },
      options: { ...commonOptions, ...options }
    }
  });

  const {
    puppeteerOptions,
    snapshotOptions,
    downloadOptions,
    all,
    allOptions,
    outputOptions: { outputPath: op, pretty },
    quit
  } = parseArgs(values);

  let outputPath = path.resolve(process.cwd(), op || '.');

  const page = await openURL(url, puppeteerOptions);
  await login(page, values);
  renewSession(page);

  const spinner = cli.spinner();
  if (all) {
    spinner.start('Indexing courses');
    const snapshots = await captureAllSnapshots(page, {
      url,
      ...snapshotOptions,
      ...allOptions
    });
    fs.mkdirSync(outputPath, { recursive: true });
    for (const snapshot of snapshots) {
      await downloadSnapshot(snapshot, outputPath, {
        url,
        pretty,
        ...downloadOptions
      });
    }
  } else {
    spinner.start(`Indexing course`);
    const snapshot = await captureSnapshot(page, {
      url,
      ...snapshotOptions
    });
    if (snapshot) {
      spinner.succeed(
        `${isApiError(snapshot.SectionInfo) ? 'Course' : `${snapshot.SectionInfo.GroupName} (ID ${snapshot.SectionInfo.Id})`} indexed`
      );
      await downloadSnapshot(snapshot, outputPath, {
        url,
        pretty,
        ...downloadOptions
      });
    } else {
      spinner.fail(
        `Course could not be indexed (is ${cli.colors.url(url)} a page within the course?)`
      );
    }
  }

  stopRenewingSession();
  if (quit) {
    await page.browser().close();
  }
})();
