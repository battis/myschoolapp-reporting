import cli from '@battis/qui-cli';
import { Mutex } from 'async-mutex';
import crypto from 'node:crypto';
import events from 'node:events';
import fs from 'node:fs/promises';
import path from 'node:path';
import { Page } from 'puppeteer';
import * as common from '../../common.js';
import { isApiError } from './ApiError.js';
import * as Assignments from './Assignments.js';
import * as BulletinBoard from './BulletinBoard.js';
import * as Gradebook from './Gradebook.js';
import * as Groups from './Groups.js';
import * as SectionInfo from './SectionInfo.js';
import * as Topics from './Topics.js';

const TEMP = path.join('/tmp/msar/snapshot', crypto.randomUUID());
const tabMutex = new Mutex();

type BaseMetadata = {
  Host: string;
  User: string;
  Start: Date;
  Finish: Date;
};

export type Data = {
  Metadata: BaseMetadata;
  SectionInfo: Awaited<ReturnType<typeof SectionInfo.capture>>;
  GroupId: string;
  BulletinBoard?: Awaited<ReturnType<typeof BulletinBoard.capture>>;
  Topics?: Awaited<ReturnType<typeof Topics.capture>>;
  Assignments?: Awaited<ReturnType<typeof Assignments.capture>>;
  Gradebook?: Awaited<ReturnType<typeof Gradebook.capture>>;
};

type BaseOptions = {
  bulletinBoard?: boolean;
  topics?: boolean;
  assignments?: boolean;
  gradebook?: boolean;
  params?: URLSearchParams;
} & common.SkyAPI.args.Parsed['skyApiOptons'];

export type SingleOptions = BaseOptions & {
  url?: string;
  groupId?: string;
};

export type AllOptions = BaseOptions & {
  association?: string;
  termsOffered?: string;
  year?: string;
  batchSize?: number;
  groupsPath?: string;
};

type SnapshotMetadata = BaseMetadata & (SingleOptions | AllOptions);

export async function capture(
  parent: Page,
  {
    url,
    groupId,
    bulletinBoard,
    topics,
    assignments,
    gradebook,
    params = new URLSearchParams(),
    outputPath,
    pretty,
    ...oauthOptions
  }: SingleOptions & Partial<common.output.args.Parsed['outputOptions']>
) {
  const spinner = cli.spinner();
  spinner.start('Identifying section');
  if (url && groupId === undefined) {
    groupId = (url.match(/https:\/\/[^0-9]+(\d+)/) || { 1: undefined })[1];
  }

  if (groupId) {
    await tabMutex.acquire();
    spinner.start(`Capturing section ID ${groupId}`);
    const page = await parent.browser().newPage();
    const hostUrl = new URL(url || parent.url());
    tabMutex.release();
    await page.goto(
      `https://${hostUrl.host}/app/faculty#academicclass/${groupId}/0/bulletinboard`
    );
    const [s, b, t, g] = await Promise.all([
      SectionInfo.capture(page, groupId),
      bulletinBoard ? BulletinBoard.capture(page, groupId, params) : undefined,
      topics ? Topics.capture(page, groupId, params) : undefined,
      gradebook ? Gradebook.capture(page, groupId, params) : undefined
    ]);

    const snapshot: Data = {
      Metadata: {
        Host: url
          ? new URL(url).hostname
          : await page.evaluate(() => window.location.hostname),
        User: await page.evaluate(
          async () => (await BBAuthClient.BBAuth.getDecodedToken(null)).email
        ),
        Start: new Date(),
        Finish: new Date()
      },
      GroupId: groupId,
      SectionInfo: s,
      BulletinBoard: b,
      Topics: t,
      Assignments: assignments
        ? await Assignments.capture(page, groupId, params, oauthOptions)
        : undefined,
      Gradebook: g
    };

    if ('Teacher' in snapshot.SectionInfo) {
      spinner.succeed(
        `Group ${snapshot.SectionInfo.Id}: Snapshot captured (${snapshot.SectionInfo.Teacher}'s ${snapshot.SectionInfo.SchoolYear} ${snapshot.SectionInfo.Duration} ${snapshot.SectionInfo.GroupName})`
      );
    } else {
      spinner.warn(`Captured snapshot of section ${groupId} with errors`);
    }
    snapshot.Metadata.Finish = new Date();
    await page.close();
    if (outputPath) {
      let basename = 'snapshot';
      if (!isApiError(snapshot.SectionInfo)) {
        basename = `${snapshot.SectionInfo.SchoolYear} - ${snapshot.SectionInfo.Teacher} - ${snapshot.SectionInfo.GroupName} - ${snapshot.SectionInfo.Id}`;
      }
      common.output.writeJSON(
        await common.output.avoidOverwrite(
          common.output.filePathFromOutputPath(outputPath, `${basename}.json`)
        ),
        snapshot,
        { pretty }
      );
    }
    return snapshot;
  } else {
    spinner.fail('Unknown group ID');
    return undefined;
  }
}

export async function captureAll(
  parent: Page,
  {
    association,
    termsOffered,
    year,
    groupsPath,
    outputPath,
    batchSize = 10,
    pretty,
    ...options
  }: AllOptions & common.output.args.Parsed['outputOptions']
) {
  return new Promise<Data[]>(async (resolve) => {
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
    const spinner = cli.spinner();
    spinner.info(
      `Snapshot session ID ${cli.colors.value(path.basename(TEMP))}`
    );
    spinner.info(`${groups.length} groups match filters`);
    if (groupsPath) {
      common.output.writeJSON(
        common.output.filePathFromOutputPath(groupsPath, 'groups.json'),
        groups,
        {
          pretty
        }
      );
    }

    const zeros = new Array((groups.length + '').length).fill(0).join('');
    function pad(n: number) {
      return (zeros + n).slice(-zeros.length);
    }

    let next = 0;
    let complete = 0;
    const progress = new events.EventEmitter();
    async function nextGroup() {
      const i = next;
      next += 1;

      if (i < groups.length) {
        cli.log.debug(`Group ${i} of ${groups.length}`);
        const snapshot = await capture(parent, {
          groupId: groups[i].lead_pk.toString(),
          ...options
        });
        await common.output.writeJSON(
          path.join(TEMP, `${pad(i)}.json`),
          snapshot
        );
        progress.emit('ready');
      }
    }
    progress.on('ready', async () => {
      complete += 1;
      nextGroup();
    });

    const data: Data[] = [];
    progress.on('ready', async () => {
      if (complete === groups.length) {
        const partials = await fs.readdir(TEMP);
        for (const partial of partials) {
          data.push(
            JSON.parse((await fs.readFile(path.join(TEMP, partial))).toString())
          );
        }
        await fs.rm(TEMP, { recursive: true });
        common.output.writeJSON(
          await common.output.avoidOverwrite(
            common.output.filePathFromOutputPath(outputPath, 'snapshot.json'),
            common.output.AddTimestamp
          ),
          { pretty }
        );
        resolve(data);
      }
    });

    for (let i = 0; i < batchSize; i++) {
      nextGroup();
    }
  });
}
