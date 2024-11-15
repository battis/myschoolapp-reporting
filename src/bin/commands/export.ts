import cli from '@battis/qui-cli';
import fs from 'node:fs';
import path from 'node:path';
import * as common from '../../common.js';
import * as Download from '../../workflows/Download.js';
import * as Snapshot from '../../workflows/Snapshot.js';

(async () => {
  let {
    positionals: [url],
    values
  } = cli.init({
    args: {
      requirePositionals: 1,
      flags: { ...Snapshot.args.flags, ...Download.args.flags },
      options: { ...Snapshot.args.options, ...Download.args.options }
    }
  });

  const {
    puppeteerOptions,
    downloadOptions,
    outputOptions: { outputPath: op, pretty },
    quit,
    tokenPath,
    credentials
  } = Download.args.parse(values);
  const { snapshotOptions, all, allOptions } = Snapshot.args.parse(values);

  let outputPath = path.resolve(process.cwd(), op || '.');

  const page = await common.puppeteer.openURL(url, puppeteerOptions);
  await common.puppeteer.login(page, values);
  common.puppeteer.renewSession(page);

  const spinner = cli.spinner();
  if (all) {
    spinner.start('Indexing courses');
    const snapshots = await Snapshot.captureAll(page, {
      url,
      ...snapshotOptions,
      ...allOptions
    });
    fs.mkdirSync(outputPath, { recursive: true });
    for (const snapshot of snapshots) {
      await Download.supportingFiles(snapshot, outputPath, {
        pretty,
        ...downloadOptions
      });
    }
  } else {
    spinner.start(`Indexing course`);
    const s = await Snapshot.capture(page, {
      url,
      ...snapshotOptions,
      tokenPath,
      credentials
    });
    if (s) {
      spinner.succeed(
        `${Snapshot.isApiError(s.SectionInfo) ? 'Course' : `${s.SectionInfo.GroupName} (ID ${s.SectionInfo.Id})`} indexed`
      );
      await Download.supportingFiles(s, outputPath, {
        pretty,
        ...downloadOptions
      });
    } else {
      spinner.fail(
        `Course could not be indexed (is ${cli.colors.url(url)} a page within the course?)`
      );
    }
  }

  common.puppeteer.stopRenewingSession();
  if (quit) {
    await page.browser().close();
  }
})();
