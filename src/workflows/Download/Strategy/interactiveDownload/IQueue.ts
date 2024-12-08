import events from 'node:events';
import { DownloadStrategy } from '../DownloadStrategy.js';

export interface IQueue<T> extends events.EventEmitter {
  download: DownloadStrategy;
  enqueue(element: T): void;
  remove(element: T): void;
}
