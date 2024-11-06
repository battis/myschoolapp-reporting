#!/usr/bin/env node

import cli from '@battis/qui-cli';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import commonFlags from '../common/args/flags.js';
import commonOptions from '../common/args/options.js';
import humanize from '../common/humanize.js';
import login from '../common/login.js';
import openURL from '../common/openURL.js';
import { renewSession, stopRenewingSession } from '../common/renewSession.js';
import writeJSON from '../common/writeJSON.js';
import flags from './snapshot/args/flags.js';
import options from './snapshot/args/options.js';
import allGroups from './snapshot/Groups.js';
import captureSnapshot from './snapshot/Snapshot.js';

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

  let {
    outputPath,
    groupsPath,
    association,
    termsOffered,
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
  const headless = !!values.headless;
  const all = !!values.all;
  const bulletinBoard = !!values.bulletinBoard;
  const topics = !!values.topics;
  const gradebook = !!values.gradebook;
  const batchSize = parseInt(values.batchSize);
  const width = parseInt(values.viewportWidth);
  const height = parseInt(values.viewportHeight);
  const pretty = !!values.pretty;
  const quit = !!values.quit;

  const page = await openURL(url, {
    headless: !!(headless && values.username && values.password),
    defaultViewport: { width, height }
  });
  await login(page, values);
  values.username = '';
  values.password = '';
  renewSession(page);

  let data;

  if (all) {
    const session = crypto.randomUUID();
    const _assoc = (association || '').split(',').map((t) => t.trim());
    const _terms = (termsOffered || '').split(',').map((t) => t.trim());
    const groups = (await allGroups(page)).filter(
      (group) =>
        (association === undefined || _assoc.includes(group.association)) &&
        (termsOffered === undefined ||
          _terms.reduce(
            (match, term) => match && group.terms_offered.includes(term),
            true
          ))
    );
    const spinner = cli.spinner();
    spinner.info(`${groups.length} groups match filters`);
    if (groupsPath) {
      writeJSON(groupsPath, groups, {
        pretty,
        name: 'groups'
      });
    }

    data = [];
    await fs.mkdir(`/tmp/snapshot/${session}`, { recursive: true });
    const zeros = new Array((groups.length + '').length).fill(0).join('');
    function pad(n: number) {
      return (zeros + n).slice(-zeros.length);
    }
    for (let i = 0; i < groups.length; i += batchSize) {
      const batch = groups.slice(i, i + batchSize);
      const host = new URL(page.url()).host;
      humanize(
        page,
        path.join(
          `https://${host}`,
          'app/faculty#academicclass',
          batch[0].lead_pk.toString(),
          '0/bulletinboard'
        )
      );
      await Promise.allSettled(
        batch.map(async (group, n) => {
          const snapshot = await captureSnapshot(page, {
            groupId: group.lead_pk.toString(),
            bulletinBoard,
            topics,
            gradebook,
            params
          });
          await fs.writeFile(
            `/tmp/snapshot/${session}/${pad(i + n)}.json`,
            JSON.stringify(snapshot)
          );
        })
      );
    }
    stopRenewingSession();
    const partials = await fs.readdir(`/tmp/snapshot/${session}`);
    for (const partial of partials) {
      data.push(
        JSON.parse(
          (await fs.readFile(`/tmp/snapshot/${session}/${partial}`)).toString()
        )
      );
    }
    await fs.rmdir(`/tmp/snapshot`, { recursive: true });
  } else {
    data = await captureSnapshot(page, {
      url,
      bulletinBoard,
      topics,
      gradebook,
      params
    });
  }

  cli.log.debug(outputPath);
  writeJSON(outputPath, data, { pretty, name: 'snapshot' });

  if (quit) {
    await page.browser().close();
  }
})();
