import cli from '@battis/qui-cli';
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
  url = normalizeURL(url);
  if (url in cache) {
    if (cache[url] === AWAITING) {
      return new Promise((resolve) => {
        ready.on(url, () => resolve(cache[url] as Item));
      });
    }
    return cache[url] as Item;
  } else {
    cache[url] = AWAITING;
    cache[url] = await downloader();
    ready.emit(url);
    return cache[url] as Item;
  }
}

function normalizeURL(url: string) {
  const normalized = url
    .replace(/^(\/.+\?.*)(w|h)=\dpx&?(.*)$/, '$1$3')
    .replace(/\?$/, '');
  if (normalized !== url) {
    cli.log.debug(
      `${cli.colors.url(url)} normalized to ${cli.colors.url(normalized)}`
    );
  }
  return normalized;
}
