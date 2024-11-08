import parseSnapshotArgs from '../../snapshot/args/parse.js';

type Result = ReturnType<typeof parseSnapshotArgs> & {
  downloadOptions: {
    include?: RegExp[];
    exclude?: RegExp[];
  };
};

function stringToRegExpArray(arg: string): RegExp[] | undefined {
  return arg && arg !== ''
    ? arg.split(',').map((exp) => new RegExp(exp))
    : undefined;
}

export default function parseArgs(values: Record<string, string>): Result {
  return {
    ...parseSnapshotArgs(values),
    downloadOptions: {
      include: stringToRegExpArray(values.include),
      exclude: stringToRegExpArray(values.exclude)
    }
  };
}
