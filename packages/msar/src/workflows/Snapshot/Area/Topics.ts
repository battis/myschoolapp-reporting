import cli from '@battis/qui-cli';
import { api as types } from 'datadirect';
import { api } from 'datadirect-puppeteer';
import * as common from '../../../common.js';
import * as Base from './Base.js';

export type Item = types.datadirect.topiccontentget.Item & {
  ObjectType?: types.datadirect.TopicContentTypesGet.Item;
  Content?: types.datadirect.common.ContentItem.Any.Content | { error: string };
};

export type Topic = types.datadirect.sectiontopicsget.Item & {
  Content?: Item[];
};

export type Data = Topic[];

let possibleContent:
  | types.datadirect.TopicContentTypesGet.Response
  | undefined = undefined;

async function getPossibleContent() {
  if (!possibleContent) {
    possibleContent = possibleContent =
      await api.datadirect.TopicContentTypesGet({ payload: {} });
  }
  return possibleContent;
}

export const snapshot: Base.Snapshot<Data> = async ({
  groupId: Id,
  payload,
  ignoreErrors = true,
  studentData,
  ...options
}): Promise<Data | undefined> => {
  common.Debug.withGroupId(Id, 'Start capturing topics');
  try {
    const Topics: Data = [];
    await getPossibleContent();
    const topics = await api.datadirect.sectiontopicsget({
      ...options,
      payload: {
        // TODO Fix typing to avoid parameter redundancy
        active: true,
        future: true,
        expired: true,
        ...payload,
        format: 'json', // TODO Empirically, `format` is often optional
        sharedTopics: true // TODO sharedTopics should be configurable
      },
      pathParams: { Id }
    });
    for (const topic of topics) {
      const { TopicID } = topic;
      const Content: Item[] = [];
      const items: types.datadirect.topiccontentget.Response = (
        await api.datadirect.topiccontentget({
          ...options,
          payload: {
            format: 'json',
            index_id: topic.TopicIndexID,
            id: topic.TopicIndexID // TODO should this be topic.TopicID?
          },
          pathParams: {
            TopicID
          }
        })
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
          const entry: Item = {
            ...item,
            ObjectType,
            Content: await api.datadirect.TopicContent_detail(
              item,
              possibleContent!,
              {
                ...options,
                payload: {
                  format: 'json',
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
                pathParams: { Id }
              }
            )
          };
          if (
            !studentData &&
            entry.ObjectType?.Name === 'Discussion Thread' &&
            'Content' in entry
          ) {
            entry.Content = { error: new Base.StudentDataError().message };
          }
          Content.push(entry);
        } catch (error) {
          if (error instanceof types.datadirect.common.TopicContentError) {
            Content.push({ ...item, ObjectType });
          } else {
            Content?.push({
              ...item,
              ObjectType,
              Content: { error: (error as Error).message }
            });
            if (!(error instanceof Base.StudentDataError)) {
              common.Debug.errorWithGroupId(
                Id,
                `Error capturing topic {TopicID: ${cli.colors.value(TopicID)}, ContentItemId: ${cli.colors.value(item.ContentItemId)}, ObjectType: ${cli.colors.quotedValue(`"${ObjectType?.Name}"`)}}`,
                error as string
              );
            }
          }
        }
      }
      Topics.push({ ...topic, Content: Content.length ? Content : undefined });
    }
    common.Debug.withGroupId(Id, 'Topics captured');
    // FIXME filter student data out of topic discussions
    return Topics;
  } catch (error) {
    if (ignoreErrors) {
      common.Debug.errorWithGroupId(
        Id,
        'Error capturing topics',
        error as string
      );
      return undefined;
    } else {
      throw error;
    }
  }
};
