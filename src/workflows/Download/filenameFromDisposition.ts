import cli from '@battis/qui-cli';
import contentDisposition from 'content-disposition';
import path from 'node:path';

export const ContentDisposition = 'content-disposition';

type Options = {
  url: string;
  value?: string;
};

/**
 * Extract the filename from the Content-Disposition header, if present. Fall
 * back to the actual file name being fetched.
 */
export function filenameFromDisposition({ url, value }: Options): string {
  let filename = path.basename(new URL(url).pathname);
  if (value) {
    try {
      filename = contentDisposition.parse(value || '').parameters?.filename;
      cli.log.debug(`${url}: ${filename}`);
    } catch (error) {
      cli.log.warning(
        `Error parsing ${cli.colors.url(url)} {${ContentDisposition}: ${cli.colors.quotedValue(`"${value}"`)}}: ${cli.colors.error(error)}`
      );
    }
  }
  return filename;
}
