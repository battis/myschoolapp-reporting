import cli from '@battis/qui-cli';
import { Page } from 'puppeteer';
import * as DataDirect from '../../Blackbaud/DataDirect.js';
import { ApiError } from './ApiError.js';

type Topic = DataDirect.SectionTopic & {
  Content?: (DataDirect.ContentItem & {
    ObjectType?: DataDirect.ObjectType;
    Content?: any;
  })[];
};

export default async function captureTopics(
  page: Page,
  groupId: string,
  params: URLSearchParams
): Promise<Topic[] | ApiError> {
  const spinner = cli.spinner();
  spinner.start('Capturing topics');
  try {
    const topics = await page.evaluate(
      async (groupId: string, params: string) => {
        const host = window.location.host;
        const possibleContent: DataDirect.ObjectType[] = await (
          await fetch(`https://${host}/api/DataDirect/TopicContentTypesGet`)
        ).json();
        const topics: Topic[] = await (
          await fetch(
            `https://${host}/api/datadirect/sectiontopicsget/${groupId}/?format=json&active=true&future=false&expired=false&sharedTopics=false`
          )
        ).json();
        for (const topic of topics) {
          topic.Content = await (
            await fetch(
              `https://${host}/api/datadirect/topiccontentget/${topic.TopicID}/?format=json&index_id=${topic.TopicIndexID}&id=${topic.TopicIndexID}`
            )
          ).json();
          for (const item of topic.Content || []) {
            const itemParams = new URLSearchParams(params);
            item.ObjectType = possibleContent.find(
              (e) => e.Id == item.ContentId
            );
            try {
              let endpoint: string | undefined;
              switch (item.ObjectType?.Name) {
                case 'Audio':
                case 'Video':
                case 'Photo':
                  endpoint = `media/sectionmediaget/${groupId}/`;
                  itemParams.append('contentId', item.ContentId.toString());
                  break;
                case 'Widget':
                  endpoint = 'widget/WidgetGet/';
                  itemParams.append('contextValue', groupId);
                  break;
                case 'Discussion Thread':
                  endpoint = 'discussionitem/discussionitemsget/';
                  itemParams.append(
                    'contentIndexId',
                    topic.TopicIndexID.toString()
                  );
                  itemParams.append('contentId', '386'); // FIXME this can't be right!!
                  itemParams.append(
                    'topicIndexId',
                    topic.TopicIndexID.toString()
                  );
                  itemParams.append('viewDate', '');
                  break;
                case 'Assignment':
                  endpoint = 'topic/topicassignmentsget/';
                  itemParams.append('id', topic.TopicID.toString());
                  itemParams.append('leadSectionId', groupId);
                  itemParams.append('row', '0');
                  itemParams.append('column', '1');
                  itemParams.append('cell', '5');
                  itemParams.append('selectedOnly', 'true');
                  break;
                case 'Cover Brief':
                case 'Cover Image':
                case 'Cover Title':
                case 'Learning Tool':
                case 'Horizontal Line':
                case 'Spacer':
                  endpoint = undefined;
                  break;
                case 'Downloads':
                case 'Expectations':
                case 'Links':
                case 'Events': // TODO not verified
                  endpoint = `${item.ObjectType.Name.replace(/^(.+)s$/, '$1')}/forsection/${groupId}/`;
                  break;
                default:
                  endpoint = `${item.ObjectType?.Name.toLowerCase().replace(' ', '')}/forsection/${groupId}/`;
              }
              if (endpoint) {
                item.Content = await (
                  await fetch(`https://${host}/api/${endpoint}?${itemParams}`)
                ).json();
              }
            } catch (error) {
              item.Content = { error };
            }
          }
        }
        return topics;
      },
      groupId,
      params.toString()
    );
    spinner.succeed('Topics captured');
    return topics;
  } catch (error) {
    spinner.fail(`Error capturing topics: ${error || 'unknown'}`);
    return { error };
  }
}
