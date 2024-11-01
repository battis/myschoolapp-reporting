import cli from '@battis/qui-cli';
import { Page } from 'puppeteer';
import captureBulletinBoard from './BulletinBoard.js';
import captureGradebook from './Gradebook.js';
import captureSectionInfo from './SectionInfo.js';
import captureTopics from './Topics.js';

type Snapshot = {
  Timestamp: Date;
  SectionInfo: Awaited<ReturnType<typeof captureSectionInfo>>;
  GroupId: string;
  BulletinBoard?: Awaited<ReturnType<typeof captureBulletinBoard>>;
  Topics?: Awaited<ReturnType<typeof captureTopics>>;
  Gradebook?: Awaited<ReturnType<typeof captureGradebook>>;
};

type SnapshotOptions = {
  url?: string;
  groupId?: string;
  bulletinBoard: boolean;
  topics: boolean;
  gradebook: boolean;
  params: URLSearchParams;
};

export default async function captureSnapshot(
  page: Page,
  { url, groupId, bulletinBoard, topics, gradebook, params }: SnapshotOptions
) {
  const spinner = cli.spinner();
  spinner.start('Identifying section');
  if (url && groupId === undefined) {
    groupId = (url.match(/https:\/\/[^0-9]+(\d+)/) || { 1: undefined })[1];
  }
  if (groupId) {
    spinner.start(`Capturing section ID ${groupId}`);
    const [SectionInfo, BulletinBoard, Topics, Gradebook] = await Promise.all([
      captureSectionInfo(page, groupId),
      bulletinBoard ? captureBulletinBoard(page, groupId, params) : undefined,
      topics ? captureTopics(page, groupId, params) : undefined,
      gradebook ? captureGradebook(page, groupId, params) : undefined
    ]);

    const snapshot: Snapshot = {
      Timestamp: new Date(),
      GroupId: groupId,
      SectionInfo,
      BulletinBoard,
      Topics,
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
