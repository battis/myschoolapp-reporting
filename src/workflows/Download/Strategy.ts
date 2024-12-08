import * as Cache from './Cache.js';
import { httpFetch, init as initHttp } from './Strategy/httpFetch.js';
import {
  init as initInteractive,
  interactiveDownload
} from './Strategy/interactiveDownload.js';

export { quit } from './Strategy/interactiveDownload.js';

export function init(
  params: Parameters<typeof initHttp>[0] & Parameters<typeof initInteractive>[0]
) {
  const { outputPath, ...credentials } = params;
  initHttp({ outputPath });
  initInteractive(credentials, outputPath);
}

export async function choose(
  snapshotComponent: object,
  key: keyof typeof snapshotComponent,
  host: string
) {
  return await Cache.get(snapshotComponent[key], async () => {
    let fetchUrl: string = snapshotComponent[key];
    if (fetchUrl.slice(0, 2) == '//') {
      fetchUrl = `https:${fetchUrl}`;
      const url = new URL(fetchUrl);
      url.searchParams.delete('w');
      fetchUrl = url.toString();
    } else if (fetchUrl.slice(0, 1) == '/') {
      fetchUrl = `https://${host}${fetchUrl}`;
    }
    if (/myschoolcdn\.com\/.+\/video\//.test(fetchUrl)) {
      fetchUrl = fetchUrl.replace(
        /(\/\d+)\/video\/video\d+_(\d+)\.(.+)/,
        '$1/$2/1/video.$3'
      );
    }
    if (/ftpimages/.test(fetchUrl)) {
      return await interactiveDownload(fetchUrl, snapshotComponent, key);
    } else {
      return await httpFetch(fetchUrl, snapshotComponent, key);
    }
  });
}
