import cli from '@battis/qui-cli';
import path from 'node:path';
import * as common from '../../common.js';
import * as Snapshot from '../Snapshot.js';
import { BaseOptions, spiderSnapshot } from './spiderSnapshot.js';

type SupportingFilesOptions = BaseOptions & {
  pretty?: boolean;
  outputPath: string;
};

export async function supportingFiles(
  snapshot: Snapshot.Data,
  { pretty = false, outputPath, ...options }: SupportingFilesOptions
) {
  if (snapshot) {
    cli.log.debug(
      `Group ${Snapshot.isApiError(snapshot.SectionInfo) ? cli.colors.error('unknown') : snapshot.SectionInfo.Id}: Downloading supporting files`
    );
    await spiderSnapshot(snapshot, {
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
