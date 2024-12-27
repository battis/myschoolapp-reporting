import cli from '@battis/qui-cli';
import { CoerceError } from '@battis/typescript-tricks';
import { api as types } from 'datadirect';
import { api } from 'datadirect-puppeteer';
import { Page } from 'puppeteer';
import * as Base from './Base.js';

export type Item = types.datadirect.topiccontentget.Item & {
  ObjectType?: types.datadirect.TopicContentTypesGet.Item;
  Content?: types.datadirect.ContentItem.Response | Base.Error;
};

export type Topic = types.datadirect.sectiontopicsget.Item & {
  Content?: Item[];
};

export type Data = Topic[];

let possibleContent:
  | types.datadirect.TopicContentTypesGet.Response
  | undefined = undefined;

async function getPossibleContent(page: Page) {
  if (!possibleContent) {
    possibleContent = possibleContent =
      await api.datadirect.TopicContentTypesGet(page, {});
  }
  return possibleContent;
}

export const snapshot: Base.Snapshot<Data> = async ({
  page,
  groupId: Id,
  payload = { format: 'json' },
  ignoreErrors = true
}): Promise<Data | undefined> => {
  cli.log.debug(`Group ${Id}: Start capturing topics`);
  try {
    const Topics: Data = [];
    await getPossibleContent(page);
    const topics = await api.datadirect.sectiontopicsget(
      page,
      {
        format: 'json',
        sharedTopics: true,
        future: !!payload.future,
        expired: !!payload.expired,
        active: !!payload.active
      },
      { Id }
    );
    for (const topic of topics) {
      const { TopicID } = topic;
      const Content: Item[] = [];
      const items = (
        await api.datadirect.topiccontentget(
          page,
          {
            format: 'json',
            index_id: topic.TopicIndexID,
            id: topic.TopicIndexID // TODO should this be topic.TopicID?
          },
          {
            TopicID
          }
        )
      ).reduce((merged, item) => {
        if (
          !merged.find(
            (m) =>
              m.ColumnIndex === item.ColumnIndex &&
              m.RowIndex === item.RowIndex &&
              m.CellIndex === item.CellIndex &&
              m.ContentId === item.ContentId
          )
        ) {
          merged.push(item);
        }
        return merged;
      }, [] as types.datadirect.topiccontentget.Response);
      for (const item of items) {
        const ObjectType = possibleContent!.find(
          (t: types.datadirect.TopicContentTypesGet.Item) =>
            t.Id == item.ContentId
        );
        try {
          Content?.push({
            ...item,
            ObjectType,
            Content: await api.datadirect.TopicContent_detail(
              item,
              possibleContent!
            )(
              page,
              {
                ...payload,
                id: TopicID,
                leadSectionId: Id,
                contextValue: Id,
                topicIndexId: TopicID,
                contentIndexId: topic.TopicIndexID,
                row: item.RowIndex,
                column: item.ColumnIndex,
                cell: item.CellIndex
              },
              { Id }
            )
          });
        } catch (e) {
          const error = CoerceError(e);
          if (
            `${error}`.endsWith('is captured by /api/topiccontentget/:TopicID')
          ) {
            Content.push({ ...item, ObjectType });
          } else {
            Content?.push({
              ...item,
              ObjectType,
              Content: { error: error.message }
            });
            if (error.message !== Base.StudentDataError) {
              cli.log.error(
                `Error capturing Topic ${TopicID} content of type ${
                  ObjectType?.Name
                } for group ${Id}: ${cli.colors.error(error)}`
              );
            }
          }
        }
      }
      Topics.push({ ...topic, Content: Content.length ? Content : undefined });
    }
    cli.log.debug(`Group ${Id}: Topics captured`);
    return Topics;
  } catch (error) {
    const message = `Group ${Id}: Error capturing topics: ${cli.colors.error(error || 'unknown')}`;
    if (ignoreErrors) {
      cli.log.error(message);
      return undefined;
    } else {
      throw new Error(message);
    }
  }
};