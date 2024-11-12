import cli from '@battis/qui-cli';
import { Page } from 'puppeteer';
import * as api from '../../Blackbaud/api.js';
import { AssignmentList } from '../../Blackbaud/SKY/Assignments.js';
import { Credentials } from '../../common/OAuth2/authorize.js';
import { getToken } from '../../common/OAuth2/refresh.js';

type Options = {
  tokenPath: string;
  credentials: Credentials;
};

export async function captureAssignments(
  page: Page,
  groupId: string,
  _: URLSearchParams,
  { tokenPath, credentials }: Options
) {
  const spinner = cli.spinner();
  spinner.start('Capturing assignments');
  const tokens = await getToken(tokenPath, credentials);
  const { client_id, client_secret, redirect_uri, ...subscriptionHeader } =
    credentials;
  const assignmentList: AssignmentList = await (
    await fetch(
      `https://api.sky.blackbaud.com/school/v1/academics/sections/${groupId}/assignments`,
      {
        headers: {
          ...subscriptionHeader,
          Authorization: `Bearer ${tokens.access_token}`
        }
      }
    )
  ).json();

  const host = new URL(page.url()).hostname;
  const assignments: api.Assignment2.Response[] = [];
  let paused = false;
  let complete = false;
  let requests: (() => Promise<void>)[] = [];
  function nextRequest() {
    if (requests.length === 0) {
      paused = false;
    } else {
      const next = requests.shift();
      if (next) {
        next();
      }
    }
  }
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
    /*
    if (paused) {
      requests.push(() => request.continue());
    } else {
      paused = true;
      request.continue();
    }*/
  });
  assPage.on('requestfinished', async (request) => {
    if (
      request.redirectChain().length === 0 &&
      /\/api\/assignment2\/UserAssignmentDetailsGetAllData/.test(request.url())
    ) {
      const response = request.response();
      assignments.push(await response?.json());
      complete = true;
      paused = false;
      requests = [];
    }
    nextRequest();
  });
  assPage.on('requestfailed', (request) => {
    nextRequest();
  });

  for (const assignment of assignmentList.value) {
    complete = false;
    await assPage.goto(
      `https://${host}/lms-assignment/assignment/assignment-preview/${assignment.index_id}`
    );
    await completion();
  }

  await assPage.close();
  spinner.succeed('Assignments captured');
  return assignments;
}
