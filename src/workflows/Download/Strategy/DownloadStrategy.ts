import * as Cache from '../Cache.js';

export type DownloadStrategy = (
  fetchUrl: string,
  snapshotComponent: object,
  key: keyof typeof snapshotComponent,
  host: string,
  outputPath: string,
  retries: number
) => Promise<Cache.Item>;
