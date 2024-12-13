import * as common from '../../../common.js';
import * as Snapshot from '../Snapshot.js';

type Result = {
  snapshotOptions: Snapshot.SingleOptions;
  all: boolean;
  allOptions: Snapshot.AllOptions;
} & ReturnType<typeof common.args.parse> &
  ReturnType<typeof common.SkyAPI.args.parse>;

export function parse(values: Record<string, any>): Result {
  const {
    groupsPath,
    association,
    termsOffered,
    year,
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
  const ignoreErrors = !!values.ignoreErrors;

  const commonParsed = common.args.parse(values);

  return {
    snapshotOptions: {
      params,
      bulletinBoard,
      topics,
      assignments,
      gradebook,
      ignoreErrors
    },
    all,
    allOptions: { association, termsOffered, year, groupsPath, batchSize },
    ...commonParsed
  };
}
