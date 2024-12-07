import cli from '@battis/qui-cli';
import chalk from 'chalk';
import * as Strategy from './Strategy.js';

export type BaseOptions = {
  include?: RegExp[];
  exclude?: RegExp[];
  haltOnError: boolean;
};

type DownloadOptions = BaseOptions & {
  host: string;
  pathToComponent: string;
};

export async function spiderSnapshot(
  snapshotComponent: object,
  outputPath: string,
  { host, pathToComponent, include, exclude, haltOnError }: DownloadOptions
) {
  if (Array.isArray(snapshotComponent)) {
    await Promise.allSettled(
      snapshotComponent.map(async (elt, i) => {
        await spiderSnapshot(elt, outputPath, {
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
          await spiderSnapshot(snapshotComponent[key], outputPath, {
            host,
            pathToComponent: `${pathToComponent}.${key}`,
            include,
            exclude,
            haltOnError
          });
        } else if (/Url$/.test(key)) {
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
              (snapshotComponent[key] as any) = await Strategy.choose(
                snapshotComponent,
                key,
                host,
                outputPath
              );
            } catch (error) {
              if (haltOnError) {
                throw error;
              } else {
                cli.log.debug(chalk.gray(`Ignored: ${error}`));
                (snapshotComponent[key] as any) = {
                  url: snapshotComponent[key],
                  error: 'Download failed'
                };
              }
            }
          }
        }
      })
    );
  }
}
