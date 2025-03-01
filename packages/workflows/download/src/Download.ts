import { Colors } from '@battis/qui-cli.colors';
import * as Plugin from '@battis/qui-cli.plugin';
import { Progress } from '@battis/qui-cli.progress';
import { Output } from '@msar/output';
import { Snapshot } from '@msar/snapshot';
import fs from 'node:fs';
import path from 'node:path';
import ora from 'ora';
import * as Args from './Args.js';
import { Spider } from './Spider.js';

export type Configuration = Plugin.Configuration & {
  include?: RegExp | RegExp[];
  exclude?: RegExp | RegExp[];
};

export const name = '@msar/download';
export const src = import.meta.dirname;

let include = [/.*/];
let exclude = [/^https?:/];

export function configure(config: Configuration = {}) {
  const _include = Plugin.hydrate(config.include, include);
  const _exclude = Plugin.hydrate(config.exclude, exclude);

  if (Array.isArray(_include)) {
    include = _include;
  } else {
    include = [_include];
  }

  if (Array.isArray(_exclude)) {
    exclude = _exclude;
  } else {
    exclude = [_exclude];
  }
}

export function options(): Plugin.Options {
  return {
    opt: {
      include: {
        description: `Comma-separated list of regular expressions to match URLs to be included in download (e.g. ${Colors.quotedValue('"^\\/,example\\.com"')}, default: ${Colors.quotedValue(`"${include.join(', ').slice(1, -1)}"`)} to include only URLs that are paths on the LMS's servers)`,
        default: include.join(',').slice(1, -1)
      },
      exclude: {
        description: `Comma-separated list of regular expressions to match URLs to exclude from download (e.g. ${Colors.quotedValue('"example\\.com,foo\\..+\\.com"')}, default: ${Colors.quotedValue(`"${exclude.join(', ').slice(1, -1)}`)})`,
        default: exclude.join(',').slice(1, -1)
      }
    },
    man: [
      {
        text: `Download the supporting files for an existing snapshot JSON file.. This command expects either 1 or 2 arguments: at least a path to an existing snapshot file (${Colors.value('arg0')}), and optionally also the desired path to the output folder of supporting files (${Colors.value('arg1')}).`
      }
    ]
  };
}

function stringToRegExpArray(arg?: string): RegExp[] | undefined {
  return arg && arg !== ''
    ? arg.split(',').map((exp) => new RegExp(exp))
    : undefined;
}

export function init({ values }: Plugin.ExpectedArguments<typeof options>) {
  include = Plugin.hydrate(stringToRegExpArray(values.include), include);
  exclude = Plugin.hydrate(stringToRegExpArray(values.exclude), exclude);
}

export async function download(
  snapshotPathArg?: string,
  args: Args.Parsed = Args.defaults
) {
  const { outputOptions, ...options } = args;
  const { quit } = options;
  const { pretty } = outputOptions;
  let { outputPath } = outputOptions;

  const spinner = ora();
  spinner.start('Reading snaphot file');

  const snapshotPath = path.resolve(process.cwd(), snapshotPathArg!);

  if (!outputPath) {
    outputPath = path.join(
      path.dirname(snapshotPath!),
      path.basename(snapshotPath!, '.json')
    );
  } else {
    if (fs.existsSync(outputPath)) {
      outputPath = await Output.avoidOverwrite(
        path.join(outputPath, path.basename(snapshotPath!, '.json'))
      );
    }
  }

  const Start = new Date();
  let snapshots: Snapshot.All.Data;
  const data = JSON.parse(fs.readFileSync(snapshotPath).toString());
  if (Array.isArray(data)) {
    snapshots = data;
  } else {
    snapshots = [data];
  }
  spinner.succeed(
    `Read ${snapshots.length} snapshots from ${Colors.url(snapshotPath)}`
  );

  const host = snapshots
    .map((snapshot) => snapshot.Metadata.Host)
    .reduce((host: string | undefined, other: string) => {
      if (!host) {
        return other;
      } else if (host !== other) {
        throw new Error('Multiple hosts present in snapshot file.');
      }
    }, undefined);
  if (!host) {
    throw new Error('No host present in snapshot file.');
  }
  const spider = new Spider({
    host,
    outputOptions: { ...outputOptions, outputPath },
    ...options
  });
  const indices: (string | undefined)[] = [];

  Progress.start({ max: snapshots.length, value: 0 });
  for (const snapshot of snapshots) {
    Progress.caption(
      `Downloading ${snapshot.SectionInfo?.Teacher}'s ${snapshot.SectionInfo?.SchoolYear} ${snapshot.SectionInfo?.GroupName} ${snapshot.SectionInfo?.Block}`
    );
    indices.push(
      await spider.download(snapshot, {
        ...options,
        outputOptions: { ...outputOptions, outputPath }
      })
    );
    Progress.increment();
  }
  Progress.stop();
  const Finish = new Date();

  const index = [];
  for (const fileName of indices) {
    if (fileName) {
      index.push(
        JSON.parse(
          fs
            .readFileSync(Output.filePathFromOutputPath(outputPath, fileName)!)
            .toString()
        )
      );
      fs.unlinkSync(Output.filePathFromOutputPath(outputPath, fileName)!);
    }
  }
  const indexPath = Output.filePathFromOutputPath(outputPath, 'index.json');
  await Output.writeJSON(indexPath, index, { pretty });
  await Output.writeJSON(
    path.resolve(indexPath, '../metadata.json'),
    {
      snapshotPath,
      Start,
      Finish,
      Elapsed: Finish.getTime() - Start.getTime(),
      ...options,
      credentials: undefined
    },
    { pretty }
  );

  if (quit) {
    await spider.quit();
  }
  spinner.succeed(
    `Snapshot supporting files exported to ${Colors.url(path.dirname(indexPath!))}`
  );
}
