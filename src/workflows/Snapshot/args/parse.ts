import * as common from '../../../common.js';
import { capture, captureAll } from '../Snapshot.js';

type Result = {
  snapshotOptions: Parameters<typeof capture>[1];
  all: boolean;
  allOptions: Parameters<typeof captureAll>[1];
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

  return {
    snapshotOptions: {
      params,
      bulletinBoard,
      topics,
      assignments,
      gradebook
    },
    all,
    allOptions: { association, termsOffered, groupsPath, batchSize },
    ...commonParsed
  };
}
