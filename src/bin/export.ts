#!/usr/bin/env node

import cli from '@battis/qui-cli';
import fs from 'node:fs';
import path from 'node:path';
import { args, downloadSnapshot } from '../commands/download.js';
import * as snapshot from '../commands/snapshot.js';
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
    downloadOptions,
    all,
    allOptions,
    outputOptions: { outputPath: op, pretty },
    quit,
    tokenPath,
    credentials
  } = args.parse(values);

  let outputPath = path.resolve(process.cwd(), op || '.');

  const page = await common.puppeteer.openURL(url, puppeteerOptions);
  await common.puppeteer.login(page, values);
  common.puppeteer.renewSession(page);

  const spinner = cli.spinner();
  if (all) {
    common.OAuth2.getToken(tokenPath, credentials);
    spinner.start('Indexing courses');
    const snapshots = await snapshot.captureAllSnapshots(page, {
      url,
      ...snapshotOptions,
      ...allOptions
    });
    fs.mkdirSync(outputPath, { recursive: true });
    for (const snapshot of snapshots) {
      await downloadSnapshot(snapshot, outputPath, {
        url,
        pretty,
        ...downloadOptions,
        tokenPath,
        credentials
      });
    }
  } else {
    spinner.start(`Indexing course`);
    const s = await snapshot.captureSnapshot(page, {
      url,
      ...snapshotOptions,
      tokenPath,
      credentials
    });
    if (s) {
      spinner.succeed(
        `${snapshot.isApiError(s.SectionInfo) ? 'Course' : `${s.SectionInfo.GroupName} (ID ${s.SectionInfo.Id})`} indexed`
      );
      await downloadSnapshot(s, outputPath, {
        url,
        pretty,
        ...downloadOptions,
        tokenPath,
        credentials
      });
    } else {
      spinner.fail(
        `Course could not be indexed (is ${cli.colors.url(url)} a page within the course?)`
      );
    }
  }

  common.puppeteer.stopRenewingSession();
  if (quit) {
    await page.browser().close();
  }
})();
