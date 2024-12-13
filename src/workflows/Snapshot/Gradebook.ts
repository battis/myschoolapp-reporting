import cli from '@battis/qui-cli';
import { Page } from 'puppeteer';
import * as api from '../../Blackbaud/api.js';

export type Data = {
  markingPeriods?: {
    markingPeriod: api.DataDirect.MarkingPeriod;
    gradebook: api.DataDirect.Gradebook;
  }[];
};

export async function capture(
  page: Page,
  groupId: string,
  params: URLSearchParams,
  ignoreErrors = true
): Promise<Data | undefined> {
  cli.log.debug(`Group ${groupId}: Start capturing gradebook`);
  try {
    const gradebook = await page.evaluate(
      async (groupId: string, params: string) => {
        const host = window.location.host;
        const markingPeriods: api.DataDirect.MarkingPeriod[] = await (
          await fetch(
            `https://${host}/api/datadirect/GradeBookMarkingPeriodList?sectionId=${groupId}`
          )
        ).json();
        const gradebook: Data = { markingPeriods: [] };
        for (const markingPeriod of markingPeriods) {
          gradebook.markingPeriods?.push({
            markingPeriod,
            gradebook: await (
              await fetch(
                `https://${host}/api/gradebook/hydrategradebook?sectionId=${groupId}&markingPeriodId=${markingPeriod.MarkingPeriodId}`
              )
            ).json()
          });
        }
        return gradebook;
      },
      groupId,
      params.toString()
    );
    cli.log.debug(`Group ${groupId}: Gradebook captured`);
    return gradebook;
  } catch (error) {
    const message = `Group ${groupId}: Error capturing gradebook: ${cli.colors.error(error || 'unknown')}`;
    if (ignoreErrors) {
      cli.log.error(message);
      return undefined;
    } else {
      throw new Error(message);
    }
  }
}
