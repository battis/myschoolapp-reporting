import cli from '@battis/qui-cli';
import { Page } from 'puppeteer';
import * as api from '../../Blackbaud/api.js';
import { ApiError } from './ApiError.js';

export type Data = {
  markingPeriods?: {
    markingPeriod: api.DataDirect.MarkingPeriod;
    gradebook: api.DataDirect.Gradebook;
  }[];
};

export async function capture(
  page: Page,
  groupId: string,
  params: URLSearchParams
): Promise<Data | ApiError> {
  const spinner = cli.spinner();
  spinner.start('Capturing gradebook');
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
    spinner.succeed('Gradebook captured');
    return gradebook;
  } catch (error) {
    spinner.fail(`Error capturing gradebook: ${error || 'unknown'}`);
    return { error };
  }
}
