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
  params: URLSearchParams,
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
  const assignments = [];
  for (const assignment of assignmentList.value) {
    console.log({ assignment });
    assignments.push(
      await page.evaluate(async (id: number) => {
        const host = window.location.host;
        return (await (
          await fetch(
            `https://${host}/api/assignment2/SecureGet?assignmentIndexId=${id}`
          )
        ).json()) as api.Assignment2.Response;
      }, assignment.id)
    );
  }

  spinner.succeed('Assignments');
  return assignments;
}
