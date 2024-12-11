import cli from '@battis/qui-cli';
import path from 'node:path';
import * as common from '../../common.js';
import * as Snapshot from '../Snapshot.js';
import * as Cache from './Cache.js';
import { Downloader, Options as DownloaderOptions } from './Downloader.js';

export type BaseOptions = {
  include?: RegExp[];
  exclude?: RegExp[];
  haltOnError: boolean;
};

type TraverseOptions = BaseOptions & {
  host: string;
  pathToComponent: string;
};

type DownloadOptions = BaseOptions & {
  pretty?: boolean;
  outputPath: string;
};

export type Options = DownloaderOptions;

export class Spider {
  private downloader: Downloader;

  public constructor(options: Options) {
    this.downloader = new Downloader(options);
  }

  public async download(
    snapshot: Snapshot.Data,
    { pretty = false, outputPath, ...options }: DownloadOptions
  ) {
    if (snapshot) {
      cli.log.debug(
        `Group ${Snapshot.isApiError(snapshot.SectionInfo) ? cli.colors.error('unknown') : snapshot.SectionInfo.Id}: Downloading supporting files`
      );
      await this.traverse(snapshot, {
        host: snapshot.Metadata.Host,
        ...options,
        pathToComponent: path.basename(outputPath)
      });
      const indexName = Snapshot.isApiError(snapshot.SectionInfo)
        ? 'index.json'
        : `${snapshot.SectionInfo.Id}.json`;
      await common.output.writeJSON(
        await common.output.avoidOverwrite(path.join(outputPath, indexName)),
        snapshot,
        {
          pretty
        }
      );
      cli.log.debug(
        `Group ${Snapshot.isApiError(snapshot.SectionInfo) ? cli.colors.error('unknown') : snapshot.SectionInfo.Id}: Supporting files exported to ${cli.colors.url(outputPath)}/${cli.colors.value(indexName)}`
      );
      return indexName;
    } else {
      cli.log.warning('Could not downlod course content (no index available)');
      return undefined;
    }
  }

  private async traverse(
    snapshotComponent: object,
    { host, pathToComponent, include, exclude, haltOnError }: TraverseOptions
  ) {
    if (Array.isArray(snapshotComponent)) {
      await Promise.allSettled(
        snapshotComponent.map(async (elt, i) => {
          await this.traverse(elt, {
            host,
            pathToComponent: `${pathToComponent}[${i}]`,
            include,
            exclude,
            haltOnError
          });
        })
      );
    } else {
      await Promise.allSettled(
        (
          Object.keys(snapshotComponent) as (keyof typeof snapshotComponent)[]
        ).map(async (key: keyof typeof snapshotComponent) => {
          // TODO ideally catch null case before recursive invocation
          if (snapshotComponent[key] === null) {
            return;
          } else if (typeof snapshotComponent[key] === 'object') {
            await this.traverse(snapshotComponent[key], {
              host,
              pathToComponent: `${pathToComponent}.${key}`,
              include,
              exclude,
              haltOnError
            });
          } else if (/Url$/i.test(key)) {
            if (
              snapshotComponent[key] &&
              (!include ||
                include.reduce(
                  (included, regex) =>
                    included || regex.test(snapshotComponent[key]),
                  false
                )) &&
              (!exclude ||
                exclude.reduce(
                  (excluded, regex) =>
                    excluded && !regex.test(snapshotComponent[key]),
                  true
                ))
            ) {
              try {
                (snapshotComponent[key] as Cache.Item) =
                  await this.downloader.download(
                    snapshotComponent[key],
                    'FriendlyFileName' in snapshotComponent &&
                      typeof snapshotComponent['FriendlyFileName'] === 'string'
                      ? snapshotComponent['FriendlyFileName']
                      : undefined
                  );
              } catch (error) {
                if (haltOnError) {
                  throw error;
                } else {
                  const message = `Download failed: ${error}`;
                  cli.log.error(message);
                  (snapshotComponent[key] as Cache.Item) = {
                    original: snapshotComponent[key],
                    accessed: new Date(),
                    error: message
                  };
                }
              }
            }
          }
        })
      );
    }
  }

  public async quit() {
    await this.downloader.quit();
  }
}
