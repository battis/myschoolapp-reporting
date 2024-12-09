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
} & (DownloadData | DownloadError);

const AWAITING = true;
const cache: Record<string, Item | typeof AWAITING> = {};
const ready = new EventEmitter();
ready.setMaxListeners(100);

export async function get(
  url: string,
  downloader: () => Promise<Item>
): Promise<Item> {
  if (url in cache) {
    if (cache[url] === AWAITING) {
      return new Promise((resolve) => {
        ready.on(url, () => resolve(cache[url] as Item));
      });
    }
    return cache[url];
  } else {
    cache[url] = AWAITING;
    cache[url] = await downloader();
    ready.emit(url);
    return cache[url];
  }
}
