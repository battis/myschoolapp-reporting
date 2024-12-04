import fs from 'node:fs';
import path from 'node:path';
import { pathsafeTimestamp } from './pathsafeTimestamp.js';

type RenamingStrategy = (filenamePath: string) => Promise<string>;

export async function avoidOverwrite(
  filePath: string,
  strategy: RenamingStrategy = AddSequence,
  force = false
) {
  if (force || fs.existsSync(filePath)) {
    return await strategy(filePath);
  }
  return filePath;
}

export const AddTimestamp: RenamingStrategy = async (
  filenamePath: string
): Promise<string> => {
  const base = path.basename(filenamePath);
  const dir = path.dirname(filenamePath);
  return path.join(dir, `${pathsafeTimestamp()}-${base}`);
};

export const AddSequence: RenamingStrategy = async (
  filenamePath: string
): Promise<string> => {
  const ext = path.extname(filenamePath);
  const base = path.basename(filenamePath, ext);
  const dir = path.dirname(filenamePath);
  const n = fs
    .readdirSync(dir)
    .filter((fileName) => fileName.startsWith(base))
    .filter((fileName) => new RegExp(`_\\d+${ext}`).test(fileName))
    .map((other) =>
      parseInt(
        other
          .match(new RegExp(`_(\\d+)${ext === '' ? '' : `\\${ext}`}$`))
          ?.slice(1)
          .shift() || '0'
      )
    )
    .reduce((max, i) => Math.max(max, i), 0);
  return path.join(dir, `${base}_${n + 1}${ext}`);
};
