import cli from '@battis/qui-cli';
import { Page } from 'puppeteer';
import * as api from '../../Blackbaud/api.js';

export async function all(page: Page, year?: string) {
  cli.log.debug(`Requesting list of all groups for ${year}`);
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
  cli.log.info(`${groups.length} groups found for ${year}`);
  return groups;
}
