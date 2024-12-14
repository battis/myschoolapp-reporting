import cli from '@battis/qui-cli';
import { api, SKY } from 'datadirect';
import { Page } from 'puppeteer';
import * as common from '../../common.js';

type Options = common.SkyAPI.args.Parsed['skyApiOptons'];

export async function capture(
  page: Page,
  groupId: string,
  _: URLSearchParams,
  options: Options
) {
  cli.log.debug(`Group ${groupId}: Start capturing assignments`);
  await common.SkyAPI.init(options);

  const assignmentList = (await common.SkyAPI.fetch(
    `school/v1/academics/sections/${groupId}/assignments`
  )) as SKY.AssignmentList;

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

    // https://stackoverflow.com/a/55422938/294171
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      request.continue();
    });
    page.on('requestfinished', async (request) => {
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
      await page.goto(
        `https://${host}/lms-assignment/assignment/assignment-preview/${assignment.index_id}`
      );
      await completion();
    }
  }
  cli.log.debug(`Group ${groupId}: Assignments captured`);
  return assignments;
}
