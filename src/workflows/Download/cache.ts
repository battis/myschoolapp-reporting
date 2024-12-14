import { EventEmitter } from 'node:events';

export type DownloadData = {
  localPath: string;
  filename?: string;
  error?: never;
};
export type DownloadError = {
  localPath?: never;
  filename?: never;
  error: string;
};
export type Item = {
  original: string;
  accessed: Date;
} & (DownloadData | DownloadError);

const AWAITING = true;
const cache: Record<string, Item | typeof AWAITING> = {};
const ready = new EventEmitter();
ready.setMaxListeners(1000);

export async function get(
  url: string,
  downloader: () => Promise<Item>
): Promise<Item> {
  // FIXME it would be safer to strip just the known useless (e.g. `w`) queryparameters and empty query strings
  const stripSearchParam = url.replace(/\?.*/, '');
  if (stripSearchParam in cache) {
    if (cache[stripSearchParam] === AWAITING) {
      return new Promise((resolve) => {
        ready.on(stripSearchParam, () =>
          resolve(cache[stripSearchParam] as Item)
        );
      });
    }
    return cache[stripSearchParam];
  } else {
    cache[stripSearchParam] = AWAITING;
    cache[stripSearchParam] = await downloader();
    ready.emit(stripSearchParam);
    return cache[stripSearchParam];
  }
}
