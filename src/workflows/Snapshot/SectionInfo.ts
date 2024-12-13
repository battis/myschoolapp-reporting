import cli from '@battis/qui-cli';
import { Page } from 'puppeteer';
import * as api from '../../Blackbaud/api.js';

export type Data = api.DataDirect.SectionInfo;

export async function capture(
  page: Page,
  groupId: string,
  ignoreErrors = true
): Promise<Data | undefined> {
  const spinner = cli.spinner();
  spinner.start(`Group ${groupId}: Capturing section info`);
  try {
    const info: api.DataDirect.SectionInfo | undefined = await page.evaluate(
      async (groupId) =>
        (
          (await (
            await fetch(`https://${window.location.host}/api/datadirect/SectionInfoView/?format=json&sectionId=${groupId}&associationId=1
    `)
          ).json()) as api.DataDirect.SectionInfo[]
        ).reduce((sectionInfo: api.DataDirect.SectionInfo | undefined, elt) => {
          if (!sectionInfo && elt.Id.toString() == groupId) {
            return elt;
          }
          return sectionInfo;
        }, undefined),
      groupId
    );
    spinner.succeed(`Group ${groupId}: Section info captured`);
    return info as api.DataDirect.SectionInfo;
  } catch (error) {
    const message = `Group ${groupId}: Error capturing section info: ${cli.colors.error(error || 'unknown')}`;
    if (ignoreErrors) {
      spinner.fail(message);
      return undefined;
    } else {
      throw new Error(message);
    }
  }
}
