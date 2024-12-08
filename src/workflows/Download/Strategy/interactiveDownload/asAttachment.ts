import { Protocol } from 'puppeteer';
import { ATTACHMENT, CONTENT_DISPOSITION, INLINE } from './values.js';

/**
 * Replace existing Content-Disposition header (or append if not present) to
 * indicate that the file should be downloaded as an attachment, rather than
 * displayed inline
 */
export function asAttachment(
  requestPausedEvent: Protocol.Fetch.RequestPausedEvent
): Protocol.Fetch.FulfillRequestRequest {
  const responseHeaders = requestPausedEvent.responseHeaders || [];
  const i = responseHeaders.findIndex(
    (header) => header.name.toLowerCase() === CONTENT_DISPOSITION
  );
  const contentDispositionHeader = {
    name: CONTENT_DISPOSITION,
    value:
      i >= 0 ? responseHeaders[i].value.replace(INLINE, ATTACHMENT) : ATTACHMENT
  };
  if (i >= 0) {
    responseHeaders[i] = contentDispositionHeader;
  } else {
    responseHeaders.push(contentDispositionHeader);
  }
  return { ...requestPausedEvent, responseHeaders, responseCode: 200 };
}
