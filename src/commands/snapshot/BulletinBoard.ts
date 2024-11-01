import cli from '@battis/qui-cli';
import * as DataDirect from 'Blackbaud/DataDirect.js';
import { Page } from 'puppeteer';
import { ApiError } from './ApiError.js';

type BulletinBoard = (DataDirect.BulletinBoardContent & {
  Content?: any;
  ContentType?: DataDirect.ContentType;
})[];

export default async function captureBulletinBoard(
  page: Page,
  groupId: string,
  params: URLSearchParams
): Promise<BulletinBoard | ApiError> {
  const spinner = cli.spinner();
  spinner.start('Capturing bulletin board');
  try {
    const BulletinBoard = await page.evaluate(
      async (groupId: string, params: string | URLSearchParams) => {
        const host = window.location.host;
        const possibleContent: DataDirect.ContentType[] = await (
          await fetch(
            `https://${host}/api/datadirect/GroupPossibleContentGet/?format=json&leadSectionId=${groupId}`
          )
        ).json();
        // TODO unclear if these IDs are consistent across instances
        possibleContent.push(
          { ContentId: 408, Content: 'Horizontal Line' },
          { ContentId: 407, Content: 'Spacer' }
        );
        const items: BulletinBoard = await (
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
            item.Content = { error };
          }
        }
        return items;
      },
      groupId,
      params.toString()
    );

    spinner.succeed('Bulletin board captured');
    return BulletinBoard;
  } catch (error) {
    spinner.fail(`Error capturing bulletin board: ${error || 'unknown'}`);
    return { error };
  }
}
