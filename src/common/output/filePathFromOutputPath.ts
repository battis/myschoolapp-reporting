import path from 'node:path';

export function filePathFromOutputPath(
  outputPath: string | undefined,
  name: string
) {
  if (!outputPath) {
    return name;
  }
  const outExt = path.extname(outputPath);
  const nameExt = path.extname(name);
  if (outExt == '') {
    return path.join(outputPath, name);
  } else {
    if (outExt === nameExt) {
      return outputPath;
    } else {
      const base = path.basename(outputPath, outExt);
      return path.join(path.dirname(outputPath), `${base}${nameExt}`);
    }
  }
}
