import cli from '@battis/qui-cli';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { Page } from 'puppeteer';
import * as common from '../../common.js';
import { captureAssignments } from './Assignments.js';
import { captureBulletinBoard } from './BulletinBoard.js';
import { captureGradebook } from './Gradebook.js';
import { allGroups } from './Groups.js';
import { captureSectionInfo } from './SectionInfo.js';
import { captureTopics } from './Topics.js';

type Snapshot = {
  Timestamp: Date;
  CapturedBy: EmailString;
  SectionInfo: Awaited<ReturnType<typeof captureSectionInfo>>;
  GroupId: string;
  BulletinBoard?: Awaited<ReturnType<typeof captureBulletinBoard>>;
  Topics?: Awaited<ReturnType<typeof captureTopics>>;
  Assignments?: Awaited<ReturnType<typeof captureAssignments>>;
  Gradebook?: Awaited<ReturnType<typeof captureGradebook>>;
};

type SnapshotOptions = {
  url?: string;
  groupId?: string;
  bulletinBoard?: boolean;
  topics?: boolean;
  assignments?: boolean;
  gradebook?: boolean;
  tokenPath?: string;
  credentials?: Parameters<typeof common.OAuth2.getToken>[1];
  params?: URLSearchParams;
};

export async function captureSnapshot(
  page: Page,
  {
    url,
    groupId,
    bulletinBoard = true,
    topics = true,
    assignments = true,
    gradebook = true,
    params = new URLSearchParams(),
    ...assignmentOptions
  }: SnapshotOptions
) {
  const spinner = cli.spinner();
  spinner.start('Identifying section');
  if (url && groupId === undefined) {
    groupId = (url.match(/https:\/\/[^0-9]+(\d+)/) || { 1: undefined })[1];
  }
  if (groupId) {
    spinner.start(`Capturing section ID ${groupId}`);
    const [SectionInfo, BulletinBoard, Topics, Assignments, Gradebook] =
      await Promise.all([
        captureSectionInfo(page, groupId),
        bulletinBoard ? captureBulletinBoard(page, groupId, params) : undefined,
        topics ? captureTopics(page, groupId, params) : undefined,
        assignments
          ? captureAssignments(page, groupId, params, assignmentOptions)
          : undefined,
        gradebook ? captureGradebook(page, groupId, params) : undefined
      ]);

    const snapshot: Snapshot = {
      Timestamp: new Date(),
      CapturedBy: await page.evaluate(
        async () => (await BBAuthClient.BBAuth.getDecodedToken(null)).email
      ),
      GroupId: groupId,
      SectionInfo,
      BulletinBoard,
      Topics,
      Assignments,
      Gradebook
    };

    if ('Teacher' in snapshot.SectionInfo) {
      spinner.succeed(
        `Captured snapshot of ${snapshot.SectionInfo.Teacher}'s ${snapshot.SectionInfo.SchoolYear} ${snapshot.SectionInfo.Duration} ${snapshot.SectionInfo.GroupName}`
      );
    } else {
      spinner.warn(`Captured snapshot of section ${groupId} with errors`);
    }
    return snapshot;
  } else {
    spinner.fail('Unknown group ID');
    return undefined;
  }
}

type AllSnapshotsOptions = {
  association?: string;
  termsOffered?: string;
  groupsPath?: string;
  batchSize?: number;
  bulletinBoard?: boolean;
  topics?: boolean;
  gradebook?: boolean;
  pretty?: boolean;
  params?: URLSearchParams;
};

export async function captureAllSnapshots(
  page: Page,
  {
    association,
    termsOffered,
    groupsPath,
    batchSize = 25,
    bulletinBoard = true,
    topics = true,
    params = new URLSearchParams(),
    gradebook = true,
    pretty = false
  }: AllSnapshotsOptions
) {
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
    common.output.writeJSON(groupsPath, groups, {
      pretty,
      name: 'groups'
    });
  }

  const data: Snapshot[] = [];
  await fs.mkdir(`/tmp/snapshot/${session}`, { recursive: true });
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
  const partials = await fs.readdir(`/tmp/snapshot/${session}`);
  for (const partial of partials) {
    data.push(
      JSON.parse(
        (await fs.readFile(`/tmp/snapshot/${session}/${partial}`)).toString()
      )
    );
  }
  await fs.rm(`/tmp/snapshot`, { recursive: true });
  return data;
}
