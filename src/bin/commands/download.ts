import cli from '@battis/qui-cli';
import fs from 'node:fs';
import path from 'node:path';
import * as common from '../../common.js';
import * as Download from '../../workflows/Download.js';
import * as Snapshot from '../../workflows/Snapshot.js';

(async () => {
  const {
    positionals: [snapshotPathArg],
    values
  } = cli.init({
    args: {
      requirePositionals: 1,
      options: Download.args.options,
      flags: Download.args.flags,
      man: [
        {
          text: 'Download the supporting files for an existing snapshot JSON file.. This command expects either 1 or 2 arguments: at least a path to an existing snapshot file, and optionally also the desired path to the output folder of supporting files.'
        }
      ]
    }
  });

  const {
    downloadOptions,
    puppeteerOptions,
    loginCredentials,
    outputOptions: { pretty, outputPath: _outputPath },
    quit
  } = Download.args.parse(values);

  const spinner = cli.spinner();
  spinner.start('Reading snaphot file');

  const snapshotPath = path.resolve(process.cwd(), snapshotPathArg!);

  let outputPath: string;
  if (!_outputPath) {
    outputPath = path.join(
      path.dirname(snapshotPath!),
      path.basename(snapshotPath!, '.json')
    );
  } else {
    if (fs.existsSync(_outputPath)) {
      // FIXME can't seem to count past 1
      outputPath = await common.output.avoidOverwrite(
        path.join(_outputPath, path.basename(snapshotPath!, '.json'))
      );
    } else {
      outputPath = _outputPath;
    }
  }

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

  const indices: (string | undefined)[] = [];

  for (const snapshot of snapshots) {
    indices.push(
      await Download.supportingFiles(snapshot, outputPath, {
        ...downloadOptions,
        ...puppeteerOptions,
        loginCredentials,
        pretty
      })
    );
  }

  const index = [];
  for (const fileName of indices) {
    if (fileName) {
      index.push(
        JSON.parse(
          fs
            .readFileSync(
              common.output.filePathFromOutputPath(outputPath, fileName)!
            )
            .toString()
        )
      );
      fs.unlinkSync(
        common.output.filePathFromOutputPath(outputPath, fileName)!
      );
    }
  }
  await common.output.writeJSON(
    common.output.filePathFromOutputPath(outputPath, 'index.json'),
    index,
    { pretty }
  );

  if (quit) {
    await Download.quit();
  }
})();
