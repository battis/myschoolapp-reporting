import * as common from '../../../common.js';

type Result = ReturnType<typeof common.args.parse> & {
  downloadOptions: {
    include?: RegExp[];
    exclude?: RegExp[];
    haltOnError: boolean;
  };
};

function stringToRegExpArray(arg: string): RegExp[] | undefined {
  return arg && arg !== ''
    ? arg.split(',').map((exp) => new RegExp(exp))
    : undefined;
}

export function parse(values: Record<string, any>): Result {
  return {
    ...common.args.parse(values),
    downloadOptions: {
      include: stringToRegExpArray(values.include),
      exclude: stringToRegExpArray(values.exclude),
      haltOnError: !!values.haltOnError
    }
  };
}
