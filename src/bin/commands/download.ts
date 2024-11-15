import cli from '@battis/qui-cli';
import fs from 'node:fs';
import path from 'node:path';
import * as Download from '../../workflows/Download.js';
import * as Snapshot from '../../workflows/Snapshot.js';

(async () => {
  let {
    positionals: [snapshotPath, outputPath],
    values
  } = cli.init({
    args: {
      requirePositionals: true,
      ...Download.args
    }
  });

  const {
    downloadOptions,
    outputOptions: { pretty }
  } = Download.args.parse(values);

  snapshotPath = path.resolve(process.cwd(), snapshotPath);
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
      pretty
    });
  }
})();
