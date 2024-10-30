#!/usr/bin/env node

import cli from '@battis/qui-cli';
import login from '../actions/login.js';
import openURL from '../actions/openURL.js';
import flags from './flags.json' with { type: 'json' };
import options from './options.json' with { type: 'json' };
import captureBulletinBoard from './snapshot/BulletinBoard.js';

type Snapshot = {
  BulletinBoard?: Awaited<ReturnType<typeof captureBulletinBoard>>;
};

(async () => {
  let {
    positionals: [url],
    values
  } = cli.init({
    args: {
      requirePositionals: 1,
      options: {
        ...options,
        format: {
          description: `Desired API response format (default: ${cli.colors.value('json')})`,
          default: 'json'
        },
        fromDate: {
          description:
            "Starting date for date-based filter where relevant (default: today's date)",
          default: new Date().toLocaleDateString('en-US')
        },
        toDate: {
          description:
            'ending date for data-based filter where relevant (default: none)',
          default: ''
        },
        contextLabelId: {
          description: `(default: ${cli.colors.value('2')})`,
          default: '2'
        }
      },
      flags: {
        ...flags,
        editMode: {
          description: '(default: false)',
          default: false
        },
        active: {
          description: `Show currently active items (default: ${cli.colors.value('true')})`,
          default: true
        },
        future: {
          description: `Show future items (default: ${cli.colors.value('false')})`,
          default: false
        },
        expired: {
          description: `Show expired items (default: ${cli.colors.value('false')})`,
          default: false
        },
        bulletinBoard: {
          description: `Include the course Bulletin Board in the snap shot (default ${cli.colors.value('true')})`,
          short: 'b',
          default: true
        }
      }
    }
  });

  const spinner = cli.spinner();
  spinner.start(`Identifying class section`);
  let groupId = (url.match(/https:\/\/[^0-9]+(\d+)/) || { 1: undefined })[1];
  if (groupId) {
    spinner.start(`Capturing section ID ${groupId}`);
    let {
      headless,
      viewportWidth,
      viewportHeight,
      format,
      contextLabelId,
      editMode,
      active,
      future,
      expired,
      fromDate,
      toDate,
      bulletinBoard
    } = values;

    const page = await openURL(url, {
      headless: !!(headless && values.username && values.password),
      defaultViewport: {
        width: parseInt(viewportWidth),
        height: parseInt(viewportHeight)
      }
    });
    await login(page, values);
    values = {}; // remove login credentials

    const snapshot: Snapshot = {};
    if (bulletinBoard) {
      snapshot.BulletinBoard = await captureBulletinBoard(
        page,
        groupId,
        new URLSearchParams({
          format,
          contextLabelId,
          editMode,
          active,
          future,
          expired,
          fromDate,
          toDate
        })
      );
    }
    cli.log.info(JSON.stringify(snapshot, null, 2));
  } else {
    spinner.fail(
      'No group ID detected in URL positional argument (try using the URL of a course bulletin board page)'
    );
  }
})();
