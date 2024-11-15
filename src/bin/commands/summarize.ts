import cli from '@battis/qui-cli';
import converter from 'json-2-csv';
import fs from 'node:fs';
import path from 'node:path';
import * as api from '../../Blackbaud/api.js';
import * as Snapshot from '../../workflows/Snapshot.js';

type Summary = api.DataDirect.SectionInfo & {
  TopicCount?: number | string;
  AssignmentCount?: number | string;
  BulletinBoardCount?: number | string;
};

(async () => {
  let {
    positionals: [snapshotPath, outputPath]
  } = cli.init({
    args: {
      requirePositionals: true,
      description:
        'Summarize an existing snapshot file as a CSV file, to bring into existing spreadsheet or other analysis software. This command expects either 1 or 2 arguments: at least a path to an existing snapshot file, and optionally also the desired path to the output file.'
    }
  });

  if (!outputPath) {
    outputPath = snapshotPath.replace(/\.json$/, '.csv');
  }

  const json = JSON.parse(
    fs.readFileSync(path.resolve(process.cwd(), snapshotPath)).toString()
  );
  const snapshots: Snapshot.Data[] = Array.isArray(json) ? json : [json];

  const summaries: Summary[] = [];

  for (const snapshot of snapshots) {
    if (Snapshot.isApiError(snapshot.SectionInfo)) {
      throw new Error(JSON.stringify(snapshot.SectionInfo));
    }
    const summary: Summary = snapshot.SectionInfo;
    summary.TopicCount = Snapshot.isApiError(snapshot.Topics)
      ? 'error'
      : snapshot.Topics?.length;
    summary.AssignmentCount = Snapshot.isApiError(snapshot.Assignments)
      ? 'error'
      : snapshot.Assignments?.length;
    summary.BulletinBoardCount = Snapshot.isApiError(snapshot.BulletinBoard)
      ? 'error'
      : snapshot.BulletinBoard?.length;
    summaries.push(summary);
  }

  const csv = converter.json2csv(summaries);
  fs.writeFileSync(path.resolve(process.cwd(), outputPath), csv);
})();
