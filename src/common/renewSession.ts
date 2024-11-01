import cli from '@battis/qui-cli';
import { Page } from 'puppeteer';

export default function renewSession(page: Page, delay = 240000) {
  const spinner = cli.spinner();
  spinner.start('Renewing session');
  page.evaluate(async () => {
    await BBAuthClient.BBAuth.renewSession();
  });
  setTimeout(renewSession, delay);
  spinner.succeed('Session renewed');
}
