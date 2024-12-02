import cli from '@battis/qui-cli';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { Page } from 'puppeteer';
import * as common from '../../common.js';
import * as Assignments from './Assignments.js';
import * as BulletinBoard from './BulletinBoard.js';
import * as Gradebook from './Gradebook.js';
import * as Groups from './Groups.js';
import * as SectionInfo from './SectionInfo.js';
import * as Topics from './Topics.js';

const TEMP = `/tmp/msar`;

type Metadata = {
  Host: string;
  User: string;
  Start: Date;
  Finish: Date;
};

export type Data = {
  Metadata: Metadata;
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
} & common.OAuth2.args.Parsed['oauthOptions'];

type SingleOptions = BaseOptions & {
  url?: string;
  groupId?: string;
};

type AllOptions = BaseOptions & {
  association?: string;
  termsOffered?: string;
  batchSize?: number;
  groupsPath?: string;
  pretty?: boolean;
};

export async function capture(
  page: Page,
  {
    url,
    groupId,
    bulletinBoard,
    topics,
    assignments,
    gradebook,
    params = new URLSearchParams(),
    ...oauthOptions
  }: SingleOptions
) {
  const spinner = cli.spinner();
  spinner.start('Identifying section');
  if (url && groupId === undefined) {
    groupId = (url.match(/https:\/\/[^0-9]+(\d+)/) || { 1: undefined })[1];
  }

  if (groupId) {
    spinner.start(`Capturing section ID ${groupId}`);
    const [s, b, t, a, g] = await Promise.all([
      SectionInfo.capture(page, groupId),
      bulletinBoard ? BulletinBoard.capture(page, groupId, params) : undefined,
      topics ? Topics.capture(page, groupId, params) : undefined,
      assignments
        ? Assignments.capture(page, groupId, params, oauthOptions)
        : undefined,
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
      Assignments: a,
      Gradebook: g
    };

    if ('Teacher' in snapshot.SectionInfo) {
      spinner.succeed(
        `Captured snapshot of ${snapshot.SectionInfo.Teacher}'s ${snapshot.SectionInfo.SchoolYear} ${snapshot.SectionInfo.Duration} ${snapshot.SectionInfo.GroupName}`
      );
    } else {
      spinner.warn(`Captured snapshot of section ${groupId} with errors`);
    }
    snapshot.Metadata.Finish = new Date();
    return snapshot;
  } else {
    spinner.fail('Unknown group ID');
    return undefined;
  }
}

export async function captureAll(
  page: Page,
  {
    association,
    termsOffered,
    groupsPath,
    batchSize = 10,
    pretty,
    ...options
  }: AllOptions
) {
  const session = crypto.randomUUID();
  const _assoc = (association || '').split(',').map((t) => t.trim());
  const _terms = (termsOffered || '').split(',').map((t) => t.trim());
  const groups = (await Groups.all(page)).filter(
    (group) =>
      (association === undefined || _assoc.includes(group.association)) &&
      (termsOffered === undefined ||
        _terms.reduce(
          (match, term) => match && group.terms_offered.includes(term),
          true
        ))
  );
  const spinner = cli.spinner();
  spinner.info(`Snapshot session ID ${cli.colors.value(session)}`);
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

  const data: Data[] = [];
  await fs.mkdir(`${TEMP}/${session}`, { recursive: true });
  const zeros = new Array((groups.length + '').length).fill(0).join('');
  function pad(n: number) {
    return (zeros + n).slice(-zeros.length);
  }

  for (let i = 0; i < groups.length; i += batchSize) {
    const batch = groups.slice(i, i + batchSize);
    const host = new URL(page.url()).host;
    common.puppeteer.humanize(
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
        const snapshot = await capture(page, {
          groupId: group.lead_pk.toString(),
          ...options
        });
        await fs.writeFile(
          `${TEMP}/${session}/${pad(i + n)}.json`,
          JSON.stringify(snapshot)
        );
      })
    );
  }
  const partials = await fs.readdir(`${TEMP}/${session}`);
  for (const partial of partials) {
    data.push(
      JSON.parse(
        (await fs.readFile(`${TEMP}/${session}/${partial}`)).toString()
      )
    );
  }
  await fs.rm(TEMP, { recursive: true });
  return data;
}
