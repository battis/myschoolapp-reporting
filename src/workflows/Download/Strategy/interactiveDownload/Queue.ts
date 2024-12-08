import events from 'node:events';
import * as Cache from '../../Cache.js';
import * as AuthenticatedSession from './AuthenticatedSession.js';
import { Downloader } from './Downloader.js';
import { IQueue } from './IQueue.js';

type QueueItem<T = object> = {
  snapshotComponent: T;
  key: keyof T;
  fetchUrl: string;
};

export class Queue extends events.EventEmitter implements IQueue<Downloader> {
  public static readonly Event = {
    Ready: 'ready'
  };

  private available = 10;
  private all: Downloader[] = [];
  private ready: Downloader[] = [];
  private queue: QueueItem[] = [];
  private complete = true;

  public constructor(
    credentials: AuthenticatedSession.Credentials,
    outputPath: string
  ) {
    super();
    Downloader.init({ outputPath });
    AuthenticatedSession.init(credentials);
    this.on(Queue.Event.Ready, () => {
      const next = this.queue.shift();
      if (next) {
        const { fetchUrl, snapshotComponent, key } = next;
        const downloader = this.get();
        if (downloader) {
          downloader.begin(fetchUrl, snapshotComponent, key);
        } else {
          throw new Error('Ready event without actual ready Downloader');
        }
      } else {
        if (this.ready.length === this.all.length) {
          this.complete = true;
        }
      }
    });
  }

  private get(): Downloader | undefined {
    const downloader = this.ready.shift();
    if (!downloader && this.available) {
      this.available -= 1;
      new Downloader(this);
    }
    return downloader;
  }

  public enqueue(downloader: Downloader): void {
    this.ready.push(downloader);
    this.emit(Queue.Event.Ready);
  }

  public remove(downloader: Downloader): void {
    this.all.splice(
      this.all.findIndex((d) => d === downloader),
      1
    );
    this.available += 1;
    this.emit(Queue.Event.Ready);
  }

  public async quit() {
    await AuthenticatedSession.quit();
    await Downloader.quit();
  }

  public async download(
    fetchUrl: string,
    snapshotComponent: object,
    key: keyof typeof snapshotComponent
  ): Promise<Cache.Item> {
    this.complete = false;
    const downloader = this.get();
    if (downloader) {
      downloader.begin(fetchUrl, snapshotComponent, key);
    } else {
      this.queue.push({ snapshotComponent, key, fetchUrl });
    }
    return new Promise((resolve) => {
      const resolver = (item: Cache.Item) => {
        this.removeListener(fetchUrl, resolver);
        resolve(item);
      };
      this.on(fetchUrl, resolver);
    });
  }
}
