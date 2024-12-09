import * as Cache from './Cache.js';
import {
  AuthenticatedFetch,
  Options as AuthOptions
} from './Downloader/AuthenticatedFetch.js';
import { HTTPFetch, Options as HTTPOptions } from './Downloader/HTTPFetch.js';
import { Strategy } from './Downloader/Strategy.js';

export type Options = AuthOptions & HTTPOptions;

export class Downloader implements Strategy {
  private auth: AuthenticatedFetch;
  private http: HTTPFetch;
  private host: string;

  public constructor({ outputPath, host, ...options }: Options) {
    this.host = host;
    this.auth = new AuthenticatedFetch({ outputPath, host, ...options });
    this.http = new HTTPFetch({ outputPath });
  }

  public async download(original: string) {
    return await Cache.get(original, async () => {
      let fetchUrl: string = original;
      if (fetchUrl.slice(0, 2) == '//') {
        fetchUrl = `https:${fetchUrl}`;
        const url = new URL(fetchUrl);
        url.searchParams.delete('w');
        fetchUrl = url.toString();
      } else if (fetchUrl.slice(0, 1) == '/') {
        fetchUrl = `https://${this.host}${fetchUrl}`;
      }
      if (/myschoolcdn\.com\/.+\/video\//.test(fetchUrl)) {
        fetchUrl = fetchUrl.replace(
          /(\/\d+)\/video\/video\d+_(\d+)\.(.+)/,
          '$1/$2/1/video.$3'
        );
      }
      let strategy: Strategy = this.http;
      if (/ftpimages/.test(fetchUrl)) {
        strategy = this.auth;
      }
      return { original, ...(await strategy.download(fetchUrl)) };
    });
  }

  public async quit() {
    await this.auth.quit();
  }
}
