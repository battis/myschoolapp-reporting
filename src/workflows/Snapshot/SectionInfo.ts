import cli from '@battis/qui-cli';
import { Page } from 'puppeteer';
import * as api from '../../Blackbaud/api.js';
import { ApiError } from './ApiError.js';

export type Data = api.DataDirect.SectionInfo;

export async function capture(
  page: Page,
  groupId: string
): Promise<Data | ApiError> {
  const spinner = cli.spinner();
  spinner.start('Capturing section info');
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
    spinner.succeed('Section info captured');
    return info as api.DataDirect.SectionInfo;
  } catch (error) {
    spinner.fail(`Error capturing section info: ${error || 'unknown'}`);
    return { error };
  }
}
