import { DownloadData, DownloadError } from '../Cache.js';

export interface Strategy {
  download(
    url: string,
    filename?: string
  ): Promise<DownloadData | DownloadError>;
}
