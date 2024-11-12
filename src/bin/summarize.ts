#!/usr/bin/env node

import cli from '@battis/qui-cli';
import converter from 'json-2-csv';
import fs from 'node:fs';
import path from 'node:path';
import * as api from '../Blackbaud/api.js';
import { Snapshot, isApiError } from '../commands/snapshot.js';

type Summary = api.DataDirect.SectionInfo & {
  TopicCount?: number | string;
  AssignmentCount?: number | string;
  BulletinBoardCount?: number | string;
};

(async () => {
  let {
    positionals: [snapshotPath, outputPath]
  } = cli.init({ args: { requirePositionals: true } });

  if (!outputPath) {
    outputPath = snapshotPath.replace(/\.json$/, '.csv');
  }

  const json = JSON.parse(
    fs.readFileSync(path.resolve(process.cwd(), snapshotPath)).toString()
  );
  const snapshots: Snapshot[] = Array.isArray(json) ? json : [json];

  const summaries: Summary[] = [];

  for (const snapshot of snapshots) {
    if (isApiError(snapshot.SectionInfo)) {
      throw new Error(JSON.stringify(snapshot.SectionInfo));
    }
    const summary: Summary = snapshot.SectionInfo;
    summary.TopicCount = isApiError(snapshot.Topics)
      ? 'error'
      : snapshot.Topics?.length;
    summary.AssignmentCount = isApiError(snapshot.Assignments)
      ? 'error'
      : snapshot.Assignments?.length;
    summary.BulletinBoardCount = isApiError(snapshot.BulletinBoard)
      ? 'error'
      : snapshot.BulletinBoard?.length;
    summaries.push(summary);
  }

  const csv = converter.json2csv(summaries);
  fs.writeFileSync(path.resolve(process.cwd(), outputPath), csv);
})();
