import cli from '@battis/qui-cli';
import { Page } from 'puppeteer';

let active = true;

export function renewSession(page: Page, delay = 240000) {
  const spinner = cli.spinner();
  if (active) {
    spinner.start('Renewing session');
    page.evaluate(async () => {
      await BBAuthClient.BBAuth.renewSession();
    });
    setTimeout(renewSession, delay);
    active = true;
    spinner.succeed('Session renewed');
  } else {
    spinner.info('Session no longer active');
  }
}

export function stopRenewingSession() {
  active = false;
}
