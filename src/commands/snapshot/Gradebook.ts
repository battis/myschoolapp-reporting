import cli from '@battis/qui-cli';
import { Page } from 'puppeteer';
import * as DataDirect from '../../Blackbaud/DataDirect.js';
import { ApiError } from './ApiError.js';

type Gradebook = {
  markingPeriods?: {
    markingPeriod: DataDirect.MarkingPeriod;
    gradebook: DataDirect.Gradebook;
  }[];
};

export default async function captureGradebook(
  page: Page,
  groupId: string,
  params: URLSearchParams
): Promise<Gradebook | ApiError> {
  const spinner = cli.spinner();
  spinner.start('Capturing gradebook');
  try {
    const gradebook = await page.evaluate(
      async (groupId: string, params: string) => {
        const host = window.location.host;
        const markingPeriods: DataDirect.MarkingPeriod[] = await (
          await fetch(
            `https://${host}/api/datadirect/GradeBookMarkingPeriodList?sectionId=${groupId}`
          )
        ).json();
        const gradebook: Gradebook = { markingPeriods: [] };
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
