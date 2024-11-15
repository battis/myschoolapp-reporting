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
      ...Snapshot.args
    }
  });

  const {
    puppeteerOptions,
    snapshotOptions,
    all,
    allOptions,
    outputOptions: { outputPath, pretty },
    quit,
    tokenPath,
    credentials
  } = Snapshot.args.parse(values);

  const page = await common.puppeteer.openURL(url, puppeteerOptions);
  await common.puppeteer.login(page, values);
  values.username = '';
  values.password = '';
  common.puppeteer.renewSession(page);

  let data;

  if (all) {
    if (snapshotOptions.assignments) {
      if (!tokenPath || !credentials) {
        throw new Error('OAuth 2.0 credentials required');
      }
      await common.OAuth2.getToken(tokenPath, credentials);
    }
    data = await Snapshot.captureAll(page, {
      ...snapshotOptions,
      ...allOptions,
      tokenPath,
      credentials
    });
  } else {
    data = await Snapshot.capture(page, {
      url,
      ...snapshotOptions,
      tokenPath,
      credentials
    });
  }

  common.puppeteer.stopRenewingSession();
  if (quit) {
    await page.browser().close();
  }

  common.output.writeJSON(outputPath, data, { pretty, name: 'snapshot' });
})();
