import cli from '@battis/qui-cli';
import { Page } from 'puppeteer';
import * as api from '../../Blackbaud/api.js';

export async function allGroups(page: Page, year?: string) {
  const spinner = cli.spinner();
  spinner.start('Listing all groups');
  if (!year) {
    const now = new Date();
    if (now.getMonth() > 6) {
      year = `${now.getFullYear()}%20-%20${now.getFullYear() + 1}`;
    } else {
      year = `${now.getFullYear() - 1}%20-%20${now.getFullYear()}`;
    }
  }
  const groups: api.DataDirect.Group[] = await page.evaluate(
    async (year: string) => {
      return await (
        await fetch(
          `https://${window.location.host}/api/dataDirect/groupFinderByYear?schoolYearLabel=${year}`
        )
      ).json();
    },
    year
  );
  spinner.succeed(`${groups.length} groups found`);
  return groups;
}
