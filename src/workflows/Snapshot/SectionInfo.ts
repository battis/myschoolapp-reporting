import cli from '@battis/qui-cli';
import { api } from 'datadirect';
import { Page } from 'puppeteer';

export type Data = api.DataDirect.SectionInfo;

export async function capture(
  page: Page,
  groupId: string,
  ignoreErrors = true
): Promise<Data | undefined> {
  cli.log.debug(`Group ${groupId}: Start capturing section info`);
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
    cli.log.debug(`Group ${groupId}: Section info captured`);
    return info as api.DataDirect.SectionInfo;
  } catch (error) {
    const message = `Group ${groupId}: Error capturing section info: ${cli.colors.error(error || 'unknown')}`;
    if (ignoreErrors) {
      cli.log.error(message);
      return undefined;
    } else {
      throw new Error(message);
    }
  }
}
