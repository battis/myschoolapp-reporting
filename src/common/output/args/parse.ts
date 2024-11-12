type Result = {
  outputOptions: { outputPath?: string; pretty: boolean };
};

export function parse(values: Record<string, string>): Result {
  const pretty = !!values.pretty;
  return {
    outputOptions: { outputPath: values.outputPath, pretty }
  };
}
