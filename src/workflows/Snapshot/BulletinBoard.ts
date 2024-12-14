import cli from '@battis/qui-cli';
import { api } from 'datadirect';
import { Page } from 'puppeteer';

export type Data = (api.DataDirect.BulletinBoardContent & {
  Content?: api.DataDirect.ContentItem | api.DataDirect.ContentItem[];
  ContentType?: api.DataDirect.ContentType;
})[];

export async function capture(
  page: Page,
  groupId: string,
  params: URLSearchParams,
  ignoreErrors = true
): Promise<Data | undefined> {
  cli.log.debug(`Group ${groupId}: Start capturing bulletin board`);
  try {
    const BulletinBoard = await page.evaluate(
      async (groupId: string, params: string | URLSearchParams) => {
        const host = window.location.host;
        const possibleContent: api.DataDirect.ContentType[] = await (
          await fetch(
            `https://${host}/api/datadirect/GroupPossibleContentGet/?format=json&leadSectionId=${groupId}`
          )
        ).json();
        // TODO unclear if these IDs are consistent across instances
        possibleContent.push(
          { ContentId: 408, Content: 'Horizontal Line' },
          { ContentId: 407, Content: 'Spacer' }
        );
        const items: Data = await (
          await fetch(
            `https://${host}/api/datadirect/BulletinBoardContentGet/?format=json&sectionId=${groupId}&associationId=1&pendingInd=false`
          )
        ).json();
        for (const item of items) {
          const itemParams = new URLSearchParams(params);
          item.ContentType = possibleContent.find(
            (e) => e.ContentId == item.ContentId
          );
          try {
            let endpoint: string | undefined;
            switch (item.ContentType?.Content) {
              case 'Audio':
              case 'Video':
              case 'Photo':
                endpoint = `media/sectionmediaget/${groupId}/`;
                itemParams.append('contentId', item.ContentId.toString());
                break;
              case 'RSS Reader':
                endpoint = `rssreader/forsection/`;
                itemParams.append('contextValue', groupId);
                break;
              case 'Widget':
                endpoint = 'widget/WidgetGet/';
                itemParams.append('contextValue', groupId);
                break;
              case 'Horizontal Line':
              case 'Spacer':
                endpoint = undefined;
                break;
              case 'Downloads':
              case 'Expectations':
              case 'Links':
              case 'Events': // TODO not verified
                endpoint = `${item.ContentType.Content.replace(/^(.+)s$/, '$1')}/forsection/${groupId}/`;
                break;
              default:
                endpoint = `${item.ContentType?.Content.toLowerCase().replace(' ', '')}/forsection/${groupId}/`;
            }
            if (endpoint) {
              item.Content = await (
                await fetch(`https://${host}/api/${endpoint}?${itemParams}`)
              ).json();
            }
          } catch (error) {
            item.Content = { error } as unknown as api.DataDirect.ContentItem;
          }
        }
        return items;
      },
      groupId,
      params.toString()
    );

    cli.log.debug(`Group ${groupId}: Bulletin board captured`);
    return BulletinBoard;
  } catch (error) {
    const message = `Group ${groupId}: Error capturing bulletin board: ${cli.colors.error(error || 'unknown')}`;
    if (ignoreErrors) {
      cli.log.error(message);
      return undefined;
    } else {
      throw new Error(message);
    }
  }
}
