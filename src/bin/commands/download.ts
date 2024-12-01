import cli from '@battis/qui-cli';
import fs from 'node:fs';
import path from 'node:path';
import * as Download from '../../workflows/Download.js';
import * as Snapshot from '../../workflows/Snapshot.js';

(async () => {
  let {
    positionals: [snapshotPath],
    values
  } = cli.init({
    args: {
      requirePositionals: true,
      options: Download.args.options,
      flags: Download.args.flags,
      man: [
        {
          text: 'Download the supporting files for an existing snapshot JSON file.. This command expects either 1 or 2 arguments: at least a path to an existing snapshot file, and optionally also the desired path to the output folder of supporting files.'
        }
      ]
    }
  });

  let {
    downloadOptions,
    puppeteerOptions,
    loginCredentials,
    outputOptions: { pretty, outputPath },
    quit
  } = Download.args.parse(values);

  snapshotPath = path.resolve(process.cwd(), snapshotPath!);
  if (!outputPath) {
    outputPath = path.join(
      path.dirname(snapshotPath),
      path.basename(snapshotPath, '.json')
    );
  }

  const spinner = cli.spinner();
  spinner.start('Reading snaphot file');

  let snapshots: Snapshot.Data[];
  const data = JSON.parse(fs.readFileSync(snapshotPath).toString());
  if (Array.isArray(data)) {
    snapshots = data;
  } else {
    snapshots = [data];
  }
  spinner.succeed(
    `Read ${snapshots.length} snapshots from ${cli.colors.url(snapshotPath)}`
  );

  for (const snapshot of snapshots) {
    await Download.supportingFiles(snapshot, outputPath, {
      ...downloadOptions,
      ...puppeteerOptions,
      loginCredentials,
      pretty
    });
  }

  if (quit) {
    await Download.quit();
  }
})();
