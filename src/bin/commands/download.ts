import cli from '@battis/qui-cli';
import cliProgress from 'cli-progress';
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

  const spider = new Download.Spider({
    outputPath,
    credentials: loginCredentials,
    host: snapshots[0].Metadata.Host
  });
  const indices: (string | undefined)[] = [];

  const progress = new cliProgress.MultiBar({});
  const bar = progress.create(snapshots.length, 0);
  for (const snapshot of snapshots) {
    progress.log(
      `Downloading ${snapshot.SectionInfo?.Teacher}'s ${snapshot.SectionInfo?.SchoolYear} ${snapshot.SectionInfo?.GroupName} ${snapshot.SectionInfo?.Block}`
    );
    indices.push(
      await spider.download(snapshot, {
        ...downloadOptions,
        outputPath,
        ...puppeteerOptions,
        pretty
      })
    );
    bar.increment();
  }
  bar.stop();

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
  const indexPath = common.output.filePathFromOutputPath(
    outputPath,
    'index.json'
  );
  await common.output.writeJSON(indexPath, index, { pretty });

  if (quit) {
    await spider.quit();
  }
  spinner.succeed(
    `Snapshot supporting files exported to ${cli.colors.url(path.dirname(indexPath!))}`
  );
})();
