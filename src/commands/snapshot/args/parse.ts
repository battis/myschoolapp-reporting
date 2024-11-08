import openURL from '../../../common/openURL.js';
import { captureAllSnapshots, captureSnapshot } from '../Snapshot.js';

type Result = {
  puppeteerOptions: Parameters<typeof openURL>[1];
  snapshotOptions: Parameters<typeof captureSnapshot>[1];
  all: boolean;
  allOptions: Parameters<typeof captureAllSnapshots>[1];
  outputOptions: { outputPath?: string; pretty: boolean };
  quit: boolean;
};

export default function parseArgs(values: Record<string, string>): Result {
  let {
    outputPath,
    groupsPath,
    association,
    termsOffered,
    format = 'json',
    contextLabelId,
    editMode,
    active,
    future,
    expired,
    fromDate,
    toDate
  } = values;
  const params = new URLSearchParams({
    format,
    contextLabelId,
    editMode,
    active,
    future,
    expired,
    fromDate,
    toDate
  });
  const headless = !!values.headless;
  const all = !!values.all;
  const bulletinBoard = !!values.bulletinBoard;
  const topics = !!values.topics;
  const gradebook = !!values.gradebook;
  const batchSize = parseInt(values.batchSize);
  const width = parseInt(values.viewportWidth);
  const height = parseInt(values.viewportHeight);
  const pretty = !!values.pretty;
  const quit = !!values.quit;

  return {
    puppeteerOptions: {
      headless: !!(headless && values.username && values.password),
      defaultViewport: { width, height }
    },
    snapshotOptions: { params, bulletinBoard, topics, gradebook },
    all,
    allOptions: { association, termsOffered, groupsPath, batchSize },
    outputOptions: { outputPath, pretty },
    quit
  };
}
