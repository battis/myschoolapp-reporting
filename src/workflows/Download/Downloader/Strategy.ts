import { DownloadData, DownloadError } from '../Cache.js';

export interface Strategy {
  download(url: string): Promise<DownloadData | DownloadError>;
}
