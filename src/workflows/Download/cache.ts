import events from 'node:events';
import { Item } from './Cache/Item.js';

export { Item };

const AWAITING = true;
const cache: Record<string, Item | typeof AWAITING> = {};
const ready = new events.EventEmitter();
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
