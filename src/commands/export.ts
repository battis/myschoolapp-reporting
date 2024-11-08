#!/usr/bin/env node

import cli from '@battis/qui-cli';
import fs from 'node:fs';
import path from 'node:path';
import commonFlags from '../common/args/flags.js';
import commonOptions from '../common/args/options.js';
import login from '../common/login.js';
import openURL from '../common/openURL.js';
import pathsafeTimestamp from '../common/pathsafeTimestamp.js';
import writeJSON from '../common/writeJSON.js';
import flags from './export/args/flags.js';
import options from './export/args/options.js';
import download from './export/download.js';
import { isApiError } from './snapshot/ApiError.js';
import { captureSnapshot } from './snapshot/Snapshot.js';
import parseArgs from './snapshot/args/parse.js';

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
    all,
    allOptions,
    outputOptions: { outputPath: op, pretty },
    quit
  } = parseArgs(values);

  let outputPath = path.resolve(process.cwd(), op || '.');

  const page = await openURL(url, puppeteerOptions);
  await login(page, values);

  const spinner = cli.spinner();
  spinner.start(`Indexing course`);
  const snapshot = await captureSnapshot(page, {
    url,
    ...snapshotOptions
  });

  if (snapshot) {
    spinner.succeed(
      `${isApiError(snapshot.SectionInfo) ? 'Course' : `${snapshot.SectionInfo.GroupName} (ID ${snapshot.SectionInfo.Id})`} indexed`
    );
    if (fs.existsSync(outputPath)) {
      outputPath = path.join(
        outputPath,
        `${pathsafeTimestamp()}-${isApiError(snapshot.SectionInfo) ? 'export' : `${snapshot.SectionInfo.Id}_${snapshot.SectionInfo.GroupName.replace(/[^a-z0-9]+/gi, '_')}`}`
      );
    }
    await download(snapshot, outputPath, {
      host: new URL(url).hostname,
      pathToComponent: path.basename(outputPath),
      include: [/^\//]
    });
    writeJSON(path.join(outputPath, 'index.json'), snapshot, { pretty });
  } else {
    spinner.fail(
      `Course could not be indexed (is ${cli.colors.url(url)} a page within the course?)`
    );
  }

  if (quit) {
    await page.browser().close();
  }
})();
