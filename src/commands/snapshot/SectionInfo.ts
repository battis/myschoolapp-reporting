import cli from '@battis/qui-cli';
import { Page } from 'puppeteer';
import * as DataDirect from '../../Blackbaud/DataDirect.js';
import { ApiError } from './ApiError.js';

export default async function captureSectionInfo(
  page: Page,
  groupId: string
): Promise<DataDirect.SectionInfo | ApiError> {
  const spinner = cli.spinner();
  spinner.start('Capturing section info');
  try {
    const info: DataDirect.SectionInfo | undefined = await page.evaluate(
      async (groupId) =>
        (
          (await (
            await fetch(`https://${window.location.host}/api/datadirect/SectionInfoView/?format=json&sectionId=${groupId}&associationId=1
    `)
          ).json()) as DataDirect.SectionInfo[]
        ).reduce((sectionInfo: DataDirect.SectionInfo | undefined, elt) => {
          if (!sectionInfo && elt.Id.toString() == groupId) {
            return elt;
          }
          return sectionInfo;
        }, undefined),
      groupId
    );
    spinner.succeed('Section info captured');
    return info as DataDirect.SectionInfo;
  } catch (error) {
    spinner.fail(`Error capturing section info: ${error || 'unknown'}`);
    return { error };
  }
}
