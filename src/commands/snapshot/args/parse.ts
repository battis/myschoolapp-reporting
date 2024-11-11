import * as common from '../../../common.js';
import { captureAllSnapshots, captureSnapshot } from '../Snapshot.js';

type Result = {
  snapshotOptions: Parameters<typeof captureSnapshot>[1];
  all: boolean;
  allOptions: Parameters<typeof captureAllSnapshots>[1];
} & ReturnType<typeof common.args.parse> &
  ReturnType<typeof common.OAuth2.args.parse>;

export function parse(values: Record<string, string>): Result {
  let {
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
  const all = !!values.all;
  const bulletinBoard = !!values.bulletinBoard;
  const topics = !!values.topics;
  const assignments = !!values.assignments;
  const gradebook = !!values.gradebook;
  const batchSize = parseInt(values.batchSize);

  const commonParsed = common.args.parse(values);
  const { tokenPath, credentials, ...commonArgs } = commonParsed;

  return {
    snapshotOptions: {
      params,
      bulletinBoard,
      topics,
      assignments,
      gradebook,
      tokenPath,
      credentials
    },
    all,
    allOptions: { association, termsOffered, groupsPath, batchSize },
    ...commonArgs
  };
}
