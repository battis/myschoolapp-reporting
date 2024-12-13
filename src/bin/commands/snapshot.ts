import cli from '@battis/qui-cli';
import * as common from '../../common.js';
import * as Snapshot from '../../workflows/Snapshot.js';

(async () => {
  const {
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
    outputOptions,
    quit
  } = Snapshot.args.parse(values);

  // TODO page creation should be abstracted away
  const page = await common.puppeteer.openURL(url!, puppeteerOptions);
  await common.puppeteer.login(page, loginCredentials);
  values.username = '';
  values.password = '';

  const spinner = cli.spinner();
  if (all) {
    spinner.start(`Capturing multiple snapshots`);
    const snapshots = await Snapshot.captureAll(page, {
      ...snapshotOptions,
      ...allOptions,
      ...skyApiOptons,
      ...outputOptions
    });
    spinner.succeed(`Captured ${snapshots.length} snapshots`);
  } else {
    spinner.start(`Capturing snapshot from ${cli.colors.url(url)}`);
    const snapshot = await Snapshot.capture(page, {
      url,
      ...snapshotOptions,
      ...skyApiOptons,
      ...outputOptions
    });
    spinner.succeed(
      `Captured snapshot of ${snapshot?.SectionInfo?.Teacher}'s ${snapshot?.SectionInfo?.SchoolYear} ${snapshot?.SectionInfo?.Duration} ${snapshot?.SectionInfo?.GroupName}`
    );
  }

  if (quit) {
    await page.browser().close();
  } else {
    cli.log.info('Quit the Chrome Test app to end.');
  }
})();
