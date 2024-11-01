#!/usr/bin/env node

import cli from '@battis/qui-cli';
import commonFlags from 'common/args/flags.js';
import commonOptions from 'common/args/options.js';
import login from 'common/login.js';
import openURL from 'common/openURL.js';
import renewSession from 'common/renewSession.js';
import writeJSON from 'common/writeJSON.js';
import path from 'node:path';
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
    output,
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

    writeJSON(path.join(process.cwd(), 'var/groups.json'), groups, {
      pretty: true
    });
    data = [];
    for (let i = 0; i < groups.length; i += batchSize) {
      const batch = groups.slice(i, i + batchSize);
      data.push(
        ...(await Promise.all(
          batch.map((group) =>
            captureSnapshot(page, {
              groupId: group.lead_pk.toString(),
              bulletinBoard,
              topics,
              gradebook,
              params
            })
          )
        ))
      );
    }
  } else {
    data = captureSnapshot(page, {
      url,
      bulletinBoard,
      topics,
      gradebook,
      params
    });
  }

  writeJSON(output, data, { pretty });

  if (quit) {
    await page.browser().close();
  }
})();
