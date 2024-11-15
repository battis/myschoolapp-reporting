export type Parsed = {
  outputOptions: { outputPath?: string; pretty: boolean };
};

export function parse(values: Record<string, string>): Parsed {
  const pretty = !!values.pretty;
  return {
    outputOptions: { outputPath: values.outputPath, pretty }
  };
}
