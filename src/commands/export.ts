#!/usr/bin/env node

import cli from '@battis/qui-cli';
import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { finished } from 'node:stream/promises';
import { ReadableStream } from 'node:stream/web';
import * as api from '../Blackbaud/api.js';
import commonFlags from '../common/args/flags.js';
import commonOptions from '../common/args/options.js';
import login from '../common/login.js';
import openURL from '../common/openURL.js';
import writeJSON from '../common/writeJSON.js';
import { isApiError } from './snapshot/ApiError.js';
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
    const downloaded: Record<string, string> = {};

    let section: keyof typeof snapshot;
    for (section of [
      'BulletinBoard',
      'Topics',
      'Assignments'
    ] as (keyof typeof snapshot)[]) {
      if (
        snapshot[section] &&
        !isApiError(snapshot[section]) &&
        Array.isArray(snapshot[section])
      ) {
        await Promise.allSettled(
          (snapshot[section]! as Array<any>).map(async (content, n) => {
            if (content.Content) {
              let items: api.DataDirect.ContentItem[];
              if (Array.isArray(content.Content)) {
                items = content.Content;
              } else {
                items = [content.Content];
              }
              await Promise.allSettled(
                items.map(async (item, m) => {
                  let key: keyof typeof item;
                  for (key of Object.keys(item) as (keyof typeof item)[]) {
                    if (/Url$/.test(key)) {
                      if (item[key]) {
                        if (downloaded[item[key]]) {
                          (item as any)[`Local${key}`] = downloaded[item[key]];
                        } else {
                          const spinner = cli.spinner();
                          let fetchUrl = item[key];
                          if (fetchUrl.slice(0, 2) == '//') {
                            fetchUrl = `https:${fetchUrl}`;
                          } else if (fetchUrl.slice(0, 1) == '/') {
                            fetchUrl = `https://${host}${fetchUrl}`;
                          }
                          if (/myschoolcdn\.com\/.+\/video\//.test(fetchUrl)) {
                            fetchUrl = fetchUrl.replace(
                              /(\/\d+)\/video\/video\d+_(\d+)\.(.+)/,
                              '$1/$2/1/video.$3'
                            );
                          }
                          try {
                            spinner.start(fetchUrl);
                            const response = await fetch(fetchUrl);
                            if (response.ok && response.body) {
                              let localPath = new URL(fetchUrl).pathname.slice(
                                1
                              );
                              if (localPath == '') {
                                localPath =
                                  new URL(fetchUrl).hostname + '/index.html';
                              }
                              downloaded[item[key]] = localPath;
                              const streamPath = path.resolve(
                                process.cwd(),
                                outputPath,
                                localPath
                              );
                              fs.mkdirSync(path.dirname(streamPath), {
                                recursive: true
                              });
                              await finished(
                                Readable.fromWeb(
                                  response.body as ReadableStream<any>
                                ).pipe(fs.createWriteStream(streamPath))
                              );

                              (item as any)[`Local${key}`] = localPath;
                              spinner.succeed(
                                `snapshot.${section}[${n}].Content[${m}].${key}: ${cli.colors.url(localPath)}`
                              );
                            } else {
                              spinner.fail(item[key]);
                            }
                          } catch (e) {
                            spinner.fail(
                              `${cli.colors.error(`${JSON.stringify(e)}:`)} ${cli.colors.url(fetchUrl)}`
                            );
                          }
                        }
                      }
                    }
                  }
                })
              );
            }
          })
        );
      }
    }
  }

  if (quit) {
    await page.browser().close();
  }

  writeJSON(path.join(outputPath, 'index.json'), snapshot, { pretty });
})();
