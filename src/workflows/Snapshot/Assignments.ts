import cli from '@battis/qui-cli';
import { Page } from 'puppeteer';
import * as api from '../../Blackbaud/api.js';
import { AssignmentList } from '../../Blackbaud/SKY/Assignments.js';
import * as common from '../../common.js';

type Options = common.OAuth2.args.Parsed['oauthOptions'];

export async function capture(
  page: Page,
  groupId: string,
  _: URLSearchParams,
  options: Options
) {
  const spinner = cli.spinner();
  spinner.start('Capturing assignments');
  const token = await common.OAuth2.getToken(options);
  if (!token) {
    throw new Error(
      `Could not acquire SKY API access token using provided OAuth 2.0 credentials`
    );
  }

  const assignmentList: AssignmentList = await (
    await fetch(
      `https://api.sky.blackbaud.com/school/v1/academics/sections/${groupId}/assignments`,
      {
        headers: {
          ...options.headers,
          Authorization: `Bearer ${token.access_token}`
        }
      }
    )
  ).json();

  const assignments: api.Assignment2.Response[] = [];
  if (assignmentList.count > 0) {
    const host = new URL(page.url()).hostname;
    let complete = false;
    function completion(timeout = 30000): Promise<void> {
      let duration = 0;
      return new Promise((resolve, reject) => {
        function pollCompletion() {
          if (complete) {
            resolve();
          } else {
            if (duration < timeout) {
              duration += 100;
              setTimeout(pollCompletion, 100);
            } else {
              reject('timeout expired');
            }
          }
        }
        pollCompletion();
      });
    }

    const assPage = await page.browser().newPage();

    // https://stackoverflow.com/a/55422938/294171
    await assPage.setRequestInterception(true);
    assPage.on('request', (request) => {
      request.continue();
    });
    assPage.on('requestfinished', async (request) => {
      if (
        request.redirectChain().length === 0 &&
        /\/api\/assignment2\/UserAssignmentDetailsGetAllData/.test(
          request.url()
        )
      ) {
        const response = request.response();
        assignments.push(await response?.json());
        complete = true;
      }
    });

    for (const assignment of assignmentList.value) {
      complete = false;
      await assPage.goto(
        `https://${host}/lms-assignment/assignment/assignment-preview/${assignment.index_id}`
      );
      await completion();
    }
    await assPage.close();
  }
  spinner.succeed('Assignments captured');
  return assignments;
}
