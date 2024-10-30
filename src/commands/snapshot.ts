import cli from '@battis/qui-cli';
import login from '../actions/login.js';
import openURL from '../actions/openURL.js';
import flags from './flags.json' with { type: 'json' };
import options from './options.json' with { type: 'json' };

namespace DataDirect {
  export type ContentType = {
    Content: string;
    ContentId: number;
    EditorAccess?: number;
    ShowContentType?: number;
  };

  export type BulletinBoardContent = {
    ContentId: number;
    RowIndex: number;
    ColumnIndex: number;
    CellIndex: 2;
    GenericSettings: any;
    PendingInd: boolean;
  };
}

type BulletinBoard = (DataDirect.BulletinBoardContent & {
  Content?: any;
  ContentType?: DataDirect.ContentType;
})[];

(async () => {
  let {
    positionals: [url],
    values
  } = cli.init({
    args: {
      requirePositionals: 1,
      options: {
        ...options,
        format: {
          description: `Desired API response format (default: ${cli.colors.value('json')})`,
          default: 'json'
        },
        fromDate: {
          description:
            "Starting date for date-based filter where relevant (default: today's date)",
          default: new Date().toLocaleDateString('en-US')
        },
        toDate: {
          description:
            'ending date for data-based filter where relevant (default: none)',
          default: ''
        },
        contextLabelId: {
          description: `(default: ${cli.colors.value('2')})`,
          default: '2'
        }
      },
      flags: {
        ...flags,
        editMode: {
          description: '(default: false)',
          default: false
        },
        active: {
          description: `Show currently active items (default: ${cli.colors.value('true')})`,
          default: true
        },
        future: {
          description: `Show future items (default: ${cli.colors.value('false')})`,
          default: false
        },
        expired: {
          description: `Show expired items (default: ${cli.colors.value('false')})`,
          default: false
        }
      }
    }
  });

  const spinner = cli.spinner();
  spinner.start(`Identifying class section`);
  let groupId = (url.match(/https:\/\/[^0-9]+(\d+)/) || { 1: undefined })[1];
  if (groupId) {
    spinner.start(`Capturing section ID ${groupId}`);
    let {
      headless,
      viewportWidth,
      viewportHeight,
      format,
      contextLabelId,
      editMode,
      active,
      future,
      expired,
      fromDate,
      toDate
    } = values;

    const page = await openURL(url, {
      headless: !!headless,
      defaultViewport: {
        width: parseInt(viewportWidth),
        height: parseInt(viewportHeight)
      }
    });
    await login(page, values);
    values = {}; // remove login credentials

    spinner.start('Capturing bulletin board');
    const bulletinBoard = await page.evaluate(
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
      new URLSearchParams({
        format,
        contextLabelId,
        editMode,
        active,
        future,
        expired,
        fromDate,
        toDate
      }).toString()
    );

    spinner.succeed('Bulletin board captured');
    cli.log.info(JSON.stringify(bulletinBoard, null, 2));
  } else {
    spinner.fail(
      'No group ID detected in URL positional argument (try using the URL of a course bulletin board page)'
    );
  }
})();
