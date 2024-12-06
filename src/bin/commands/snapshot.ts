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

  if (quit) {
    await page.browser().close();
  }

  if (!data) {
    cli.log.warning('No data captured');
  } else {
    let timestamp = new Date();
    let name = 'snapshot';
    if (Array.isArray(data)) {
      timestamp = data.reduce(
        (last, snapshot) =>
          last > snapshot.Metadata.Finish ? last : snapshot.Metadata.Finish,
        data[0].Metadata.Finish
      );
    } else {
      timestamp = data.Metadata.Finish;
      if (Snapshot.isApiError(data.SectionInfo)) {
        cli.log.warning(`Incomplete SectionInfo metadata captured`);
      } else {
        name = `${data.SectionInfo.GroupName} - ${data.SectionInfo.Identifier}`;
        if (data.SectionInfo.Block) {
          name = `${name} (${data.SectionInfo.Block})`;
        }
      }
    }
    common.output.writeJSON(
      common.output.filePathFromOutputPath(
        outputPath,
        `${common.output.pathsafeTimestamp(timestamp)}-${name}.json`
      ),
      data,
      { pretty }
    );
  }
})();
