import cli from '@battis/qui-cli';
import path from 'node:path';
import * as cache from './cache.js';
import { httpFetch } from './httpFetch.js';
import { interactiveDownload } from './interactiveDownload.js';

export async function chooseStrategy(
  snapshotComponent: object,
  key: keyof typeof snapshotComponent,
  host: string,
  outputPath: string
) {
  const spinner = cli.spinner();
  spinner.start(`Getting ${cli.colors.url(snapshotComponent[key])}`);
  let filename = path.basename(snapshotComponent[key]);
  let localPath = await cache.get(snapshotComponent[key]);
  if (!localPath) {
    spinner.start(`Downloading ${cli.colors.url(snapshotComponent[key])}`);
    let fetchUrl: string = snapshotComponent[key];
    if (fetchUrl.slice(0, 2) == '//') {
      fetchUrl = `https:${fetchUrl}`;
    } else if (fetchUrl.slice(0, 1) == '/') {
      fetchUrl = `https://${host}${fetchUrl}`;
    }
    if (/myschoolcdn\.com\/.+\/video\//.test(fetchUrl)) {
      fetchUrl = fetchUrl.replace(
        /(\/\d+)\/video\/video\d+_(\d+)\.(.+)/,
        '$1/$2/1/video.$3'
      );
    }
    filename = path.basename(fetchUrl);
    try {
      if (/ftpimages/.test(fetchUrl)) {
        filename = await interactiveDownload(
          fetchUrl,
          snapshotComponent,
          key,
          host,
          outputPath
        );
      } else {
        filename = await httpFetch(
          fetchUrl,
          snapshotComponent,
          key,
          outputPath
        );
      }
      spinner.succeed(`Downloaded ${cli.colors.url(fetchUrl)}`);
    } catch (error) {
      spinner.fail(
        `Error getting ${cli.colors.url(snapshotComponent[key])}: ${cli.colors.error(error)}`
      );
    }
  } else {
    spinner.succeed(`Using cached ${cli.colors.url(snapshotComponent[key])}`);
  }
  return {
    original: snapshotComponent[key],
    localPath,
    filename
  };
}
