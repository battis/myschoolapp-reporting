import cli from '@battis/qui-cli';
import * as common from '../../common.js';
import * as Snapshot from '../../workflows/Snapshot.js';

(async () => {
  let {
    positionals: [url],
    values
  } = cli.init({
    args: {
      requirePositionals: 1,
      options: Snapshot.args.options,
      flags: Snapshot.args.flags,
      man: [
        {
          text: `Capture a JSON snapshot of an individual course or of a collection of courses (using the ${cli.colors.value('all')} flag). In addition to relevant flags and options, the only argument expected is a URL to a page within the target course (or target LMS instance, if snapshotting more than one course).`
        }
      ]
    }
  });

  const {
    skyApiOptons,
    puppeteerOptions,
    loginCredentials,
    snapshotOptions,
    all,
    allOptions,
    outputOptions: { outputPath, pretty },
    quit
  } = Snapshot.args.parse(values);

  const page = await common.puppeteer.openURL(url!, puppeteerOptions);
  await common.puppeteer.login(page, loginCredentials);
  values.username = '';
  values.password = '';
  common.puppeteer.renewSession.start(page);

  let data;

  if (all) {
    data = await Snapshot.captureAll(page, {
      ...snapshotOptions,
      ...allOptions,
      ...skyApiOptons
    });
  } else {
    data = await Snapshot.capture(page, {
      url,
      ...snapshotOptions,
      ...skyApiOptons
    });
  }

  common.puppeteer.renewSession.stop(page);
  if (quit) {
    await page.browser().close();
  }

  common.output.writeJSON(
    common.output.filePathFromOutputPath(
      outputPath,
      !data || Array.isArray(data) || Snapshot.isApiError(data?.SectionInfo)
        ? 'snapshot.json' // FIXME get last timestamp from the file for name
        : `${common.output.pathsafeTimestamp(data.Metadata.Finish)}-${data.SectionInfo.GroupName} - ${data.SectionInfo.Identifier}${data.SectionInfo.Block ? ` (${data.SectionInfo.Block})` : ''}.json`
    ),
    data,
    { pretty }
  );
})();
