import cli from '@battis/qui-cli';
import cliProgress from 'cli-progress';
import crypto from 'node:crypto';
import { EventEmitter } from 'node:events';
import fs from 'node:fs/promises';
import path from 'node:path';
import { Page } from 'puppeteer';
import * as common from '../../../common.js';
import * as Groups from '../Groups.js';
import * as args from '../args.js';
import * as Single from './Single.js';

export type Options = Single.BaseOptions & {
  association?: string;
  termsOffered?: string;
  year?: string;
  batchSize?: number;
  groupsPath?: string;
};

const TEMP = path.join('/tmp/msar/snapshot', crypto.randomUUID());

export async function capture(
  parent: Page,
  {
    association,
    termsOffered,
    year,
    groupsPath,
    outputPath,
    batchSize = parseInt(args.options.batchSize.default),
    pretty,
    ignoreErrors,
    ...options
  }: Options & common.output.args.Parsed['outputOptions']
) {
  return new Promise<Single.Data[]>(async (resolve) => {
    const _assoc = (association || '').split(',').map((t) => t.trim());
    const _terms = (termsOffered || '').split(',').map((t) => t.trim());
    const groups = (await Groups.all(parent, year)).filter(
      (group) =>
        (association === undefined || _assoc.includes(group.association)) &&
        (termsOffered === undefined ||
          _terms.reduce(
            (match, term) => match && group.terms_offered.includes(term),
            true
          ))
    );
    cli.log.info(
      `Snapshot temporary files will be saved to ${cli.colors.url(TEMP)}`
    );
    cli.log.info(`${groups.length} groups match filters`);
    const progressBars = new cliProgress.MultiBar({});
    const progress = progressBars.create(groups.length, 0);
    if (groupsPath) {
      groupsPath = common.output.filePathFromOutputPath(
        groupsPath,
        'groups.json'
      );
      common.output.writeJSON(groupsPath, groups, {
        pretty
      });
    }

    const zeros = new Array((groups.length + '').length).fill(0).join('');
    function pad(n: number) {
      return (zeros + n).slice(-zeros.length);
    }

    let next = 0;
    let complete = 0;
    const errors: typeof groups = [];
    const queue = new EventEmitter();

    async function nextGroup() {
      const i = next;
      next += 1;

      if (i < groups.length) {
        cli.log.debug(`Group ${groups[i].lead_pk}: ${pad(i)}.json`);
        try {
          const snapshot = await Single.capture(parent, {
            groupId: groups[i].lead_pk.toString(),
            ignoreErrors,
            ...options
          });
          const tempPath = path.join(TEMP, `${pad(i)}.json`);
          await common.output.writeJSON(tempPath, snapshot);
          progressBars.log(
            `Wrote snapshot ${snapshot?.SectionInfo?.Teacher}'s ${snapshot?.SectionInfo?.SchoolYear} ${snapshot?.SectionInfo?.GroupName} ${snapshot?.SectionInfo?.Block} to ${cli.colors.url(tempPath)}\n`
          );
        } catch (error) {
          if (ignoreErrors) {
            cli.log.error(cli.colors.error(error));
            errors.push(groups[i]);
          } else {
            throw error;
          }
        }
        progress.increment();
        queue.emit('ready');
      }
    }

    queue.on('ready', async () => {
      complete += 1;
      nextGroup();
    });

    const data: Single.Data[] = [];
    let Start = new Date();
    let Finish = new Date('1/1/1970');
    let first: Single.Metadata | undefined = undefined;

    queue.on('ready', async () => {
      if (complete === groups.length) {
        const partials = await fs.readdir(TEMP);
        for (const partial of partials) {
          const snapshot = JSON.parse(
            (await fs.readFile(path.join(TEMP, partial))).toString()
          ) as Single.Data;
          data.push(snapshot);
          if (snapshot.Metadata.Start < Start) {
            Start = snapshot.Metadata.Start;
          }
          if (snapshot.Metadata.Finish > Finish) {
            Finish = snapshot.Metadata.Finish;
          }
          if (!first) {
            first = snapshot.Metadata;
          }
        }
        const filepath = await common.output.avoidOverwrite(
          common.output.filePathFromOutputPath(outputPath, 'snapshot.json'),
          common.output.AddTimestamp
        );
        const { bulletinBoard, topics, assignments, gradebook, params } =
          options;
        common.output.writeJSON(filepath, data, { pretty });
        common.output.writeJSON(filepath.replace(/\.json$/, '.metadata.json'), {
          ...first,
          Start,
          Finish,
          year,
          batchSize,
          groupsPath,
          bulletinBoard,
          topics,
          assignments,
          gradebook,
          params
        });
        if (errors.length) {
          const errorsPath = filepath.replace(/\.json$/, '.errors.json');
          common.output.writeJSON(errorsPath, errors);
          cli.log.error(`Errors output to ${cli.colors.url(errorsPath)}`);
        }
        await fs.rm(TEMP, { recursive: true });
        progressBars.stop();
        resolve(data);
      }
    });

    for (let i = 0; i < batchSize; i++) {
      nextGroup();
    }
  });
}
