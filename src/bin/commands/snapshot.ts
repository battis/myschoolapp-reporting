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
      description: `Capture a JSON snapshot of an individual course or of a collection of courses (using the ${cli.colors.value('all')} flag). In addition to relevant flags and options, the only argument expected is a URL to a page within the target course (or target LMS instance, if snapshotting more than one course).`
    }
  });

  const {
    oauthOptions,
    puppeteerOptions,
    snapshotOptions,
    all,
    allOptions,
    outputOptions: { outputPath, pretty },
    quit
  } = Snapshot.args.parse(values);

  const page = await common.puppeteer.openURL(url, puppeteerOptions);
  await common.puppeteer.login(page, values);
  values.username = '';
  values.password = '';
  common.puppeteer.renewSession(page);

  let data;

  if (all) {
    data = await Snapshot.captureAll(page, {
      ...snapshotOptions,
      ...allOptions,
      ...oauthOptions
    });
  } else {
    data = await Snapshot.capture(page, {
      url,
      ...snapshotOptions,
      ...oauthOptions
    });
  }

  common.puppeteer.stopRenewingSession();
  if (quit) {
    await page.browser().close();
  }

  common.output.writeJSON(outputPath, data, { pretty, name: 'snapshot' });
})();
