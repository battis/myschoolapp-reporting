import cli from '@battis/qui-cli';
import { Mutex } from 'async-mutex';
import { Page } from 'puppeteer';
import * as common from '../../../common.js';
import * as Assignments from '../Assignments.js';
import * as BulletinBoard from '../BulletinBoard.js';
import * as Gradebook from '../Gradebook.js';
import * as SectionInfo from '../SectionInfo.js';
import * as Topics from '../Topics.js';

export type Metadata = {
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

export type BaseOptions = {
  bulletinBoard?: boolean;
  topics?: boolean;
  assignments?: boolean;
  gradebook?: boolean;
  params?: URLSearchParams;
  ignoreErrors?: boolean;
} & common.SkyAPI.args.Parsed['skyApiOptons'];

export type Options = BaseOptions & {
  url?: string;
  groupId?: string;
};

const tabMutex = new Mutex();

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
    ignoreErrors,
    ...oauthOptions
  }: Options & Partial<common.output.args.Parsed['outputOptions']>
) {
  if (url && groupId === undefined) {
    groupId = (url.match(/https:\/\/[^0-9]+(\d+)/) || { 1: undefined })[1];
  }

  if (groupId) {
    await tabMutex.acquire();
    cli.log.debug(`Capturing section ID ${groupId}`);
    const page = await parent.browser().newPage();
    const hostUrl = new URL(url || parent.url());
    tabMutex.release();
    await page.goto(
      `https://${hostUrl.host}/app/faculty#academicclass/${groupId}/0/bulletinboard`
    );
    const [s, b, t, g] = await Promise.all([
      SectionInfo.capture(page, groupId, ignoreErrors),
      bulletinBoard
        ? BulletinBoard.capture(page, groupId, params, ignoreErrors)
        : undefined,
      topics ? Topics.capture(page, groupId, params, ignoreErrors) : undefined,
      gradebook
        ? Gradebook.capture(page, groupId, params, ignoreErrors)
        : undefined
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

    if (snapshot.SectionInfo && 'Teacher' in snapshot.SectionInfo) {
      cli.log.info(
        `Group ${snapshot.SectionInfo.Id}: Snapshot captured (${snapshot.SectionInfo.Teacher}'s ${snapshot.SectionInfo.SchoolYear} ${snapshot.SectionInfo.Duration} ${snapshot.SectionInfo.GroupName})`
      );
    } else {
      cli.log.error(`Captured snapshot of section ${groupId} with errors`);
    }
    snapshot.Metadata.Finish = new Date();
    await page.close();
    if (outputPath) {
      let basename = 'snapshot';
      if (snapshot.SectionInfo) {
        basename = `${snapshot.SectionInfo.SchoolYear} - ${snapshot.SectionInfo.Teacher} - ${snapshot.SectionInfo.GroupName} - ${snapshot.SectionInfo.Id}`;
      }
      const filepath = await common.output.avoidOverwrite(
        common.output.filePathFromOutputPath(outputPath, `${basename}.json`)
      );
      common.output.writeJSON(filepath, snapshot, { pretty });
      common.output.writeJSON(
        filepath.replace(/\.json$/, '.metadata.json'),
        {
          ...snapshot.Metadata,
          bulletinBoard,
          topics,
          assignments,
          gradebook,
          params
        },
        { pretty }
      );
    }
    return snapshot;
  } else {
    cli.log.error('Unknown group ID');
    return undefined;
  }
}
