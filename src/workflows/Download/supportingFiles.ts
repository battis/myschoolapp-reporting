import cli from '@battis/qui-cli';
import fs from 'node:fs';
import path from 'node:path';
import * as common from '../../common.js';
import * as Snapshot from '../Snapshot.js';
import * as Strategy from './Strategy.js';
import { BaseOptions, spiderSnapshot } from './spiderSnapshot.js';

type SupportingFilesOptions = BaseOptions & {
  pretty?: boolean;
  loginCredentials?: {
    username?: string;
    password?: string;
    sso?: string;
  };
};

export async function supportingFiles(
  snapshot: Snapshot.Data,
  outputPath: string,
  { pretty = false, loginCredentials, ...options }: SupportingFilesOptions
) {
  Strategy.setLoginCredentials(loginCredentials);
  if (snapshot) {
    cli.log.debug(
      `Group ${Snapshot.isApiError(snapshot.SectionInfo) ? cli.colors.error('unknown') : snapshot.SectionInfo.Id}: Downloading supporting files`
    );
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }
    await spiderSnapshot(snapshot, outputPath, {
      host: snapshot.Metadata.Host,
      ...options,
      pathToComponent: path.basename(outputPath)
    });
    const indexName = Snapshot.isApiError(snapshot.SectionInfo)
      ? 'index.json'
      : `${snapshot.SectionInfo.Id}.json`;
    await common.output.writeJSON(
      await common.output.avoidOverwrite(path.join(outputPath, indexName)),
      snapshot,
      {
        pretty
      }
    );
    cli.log.debug(
      `Group ${Snapshot.isApiError(snapshot.SectionInfo) ? cli.colors.error('unknown') : snapshot.SectionInfo.Id}: Supporting files exported to ${cli.colors.url(outputPath)}/${cli.colors.value(indexName)}`
    );
    return indexName;
  } else {
    cli.log.warning('Could not downlod course content (no index available)');
    return undefined;
  }
}
