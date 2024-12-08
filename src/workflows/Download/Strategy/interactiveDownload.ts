import { DownloadStrategy } from './DownloadStrategy.js';
import { Credentials } from './interactiveDownload/AuthenticatedSession.js';
import { Queue } from './interactiveDownload/Queue.js';

let queue: Queue | undefined = undefined;

export const init = (credentials: Credentials, outputPath: string) =>
  (queue = new Queue(credentials, outputPath));

export const interactiveDownload: DownloadStrategy = queue.download;

export const quit = queue.quit;
