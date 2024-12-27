import cli from '@battis/qui-cli';
import { CoerceError } from '@battis/typescript-tricks';
import { api as types } from 'datadirect';
import { api } from 'datadirect-puppeteer';
import { Page } from 'puppeteer';
import * as Base from './Base.js';

export type Item = types.datadirect.BulletinBoardContentGet.Item & {
  Content?: types.datadirect.ContentItem.Response | Base.Error;
  ContentType?: types.datadirect.ContentType.Any;
};
export type Data = Item[];

const studentDataContentTypes = ['Roster'];

let possibleContent:
  | types.datadirect.GroupPossibleContentGet.Response
  | undefined = undefined;

async function getPossibleContent(page: Page, leadSectionId: number) {
  if (!possibleContent) {
    possibleContent = await api.datadirect.GroupPossibleContentGet(page, {
      format: 'json',
      leadSectionId
    });
  }
  return possibleContent;
}

export const snaphot: Base.Snapshot<Data> = async ({
  page,
  groupId: Id,
  payload = { format: 'json' },
  ignoreErrors = true,
  studentData
}): Promise<Data | undefined> => {
  cli.log.debug(`Group ${Id}: Start capturing bulletin board`);
  try {
    const BulletinBoard: Data = [];
    await getPossibleContent(page, Id);
    const items = await api.datadirect.BulletinBoardContentGet(page, {
      format: 'json',
      sectionId: Id,
      associationId: 1,
      pendingInd: false
    });
    for (const item of items) {
      const ContentType = possibleContent!.find(
        (e: types.datadirect.ContentType.Any) => e.ContentId == item.ContentId
      );
      try {
        if (
          ContentType &&
          studentDataContentTypes.includes(ContentType.Content) &&
          !studentData
        ) {
          throw new Error(Base.StudentDataError);
        }
        BulletinBoard.push({
          ...item,
          ContentType,
          Content: await api.datadirect.BulletinBoardContent_detail(
            item,
            possibleContent!
          )(page, { ...payload, contextValue: Id }, { Id })
        });
      } catch (e) {
        const error = CoerceError(e);
        BulletinBoard.push({
          ...item,
          ContentType,
          Content: { error: error.message }
        });
        if (error.message !== Base.StudentDataError) {
          cli.log.error(
            `Error capturing Bulletin Board content of type ${ContentType?.Content} for group ${Id}: ${cli.colors.error(error)}`
          );
        }
      }
    }

    cli.log.debug(`Group ${Id}: Bulletin board captured`);
    return BulletinBoard;
  } catch (error) {
    const message = `Group ${Id}: Error capturing bulletin board: ${cli.colors.error(error || 'unknown')}`;
    if (ignoreErrors) {
      cli.log.error(message);
      return undefined;
    } else {
      throw new Error(message);
    }
  }
};