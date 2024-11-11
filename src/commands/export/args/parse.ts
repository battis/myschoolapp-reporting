import * as snapshot from '../../snapshot.js';

type Result = ReturnType<typeof snapshot.args.parse> & {
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

export function parse(values: Record<string, string>): Result {
  return {
    ...snapshot.args.parse(values),
    downloadOptions: {
      include: stringToRegExpArray(values.include),
      exclude: stringToRegExpArray(values.exclude)
    }
  };
}
