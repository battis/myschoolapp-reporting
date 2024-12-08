import cli from '@battis/qui-cli';
import contentDisposition from 'content-disposition';
import path from 'node:path';
import { Protocol } from 'puppeteer';
import { CONTENT_DISPOSITION } from './values.js';

/**
 * Extract the filename from the Content-Disposition header, if present. Fall
 * back to the actual file name being fetched.
 */
export function filenameFromDisposition(
  requestPausedEvent: Protocol.Fetch.RequestPausedEvent
): string {
  const basename = path.basename(
    new URL(requestPausedEvent.request.url).pathname
  );
  let filename: string | undefined = undefined;
  const value = requestPausedEvent.responseHeaders?.find(
    (header) => header.name.toLowerCase() === CONTENT_DISPOSITION
  )?.value;
  try {
    filename = contentDisposition.parse(value || '').parameters?.filename;
  } catch (error) {
    cli.log.warning(
      `Error parsing ${cli.colors.url(requestPausedEvent.request.url)} Content-Disposition ${cli.colors.quotedValue(`"${value}"`)}: ${cli.colors.error(error)}`
    );
  }
  return filename || basename;
}
