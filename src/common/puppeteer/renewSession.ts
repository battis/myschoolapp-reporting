import cli from '@battis/qui-cli';
import { Page } from 'puppeteer';

const pages: Page[] = [];

export function start(page: Page, delay = 240000) {
  if (!pages.includes(page)) {
    pages.push(page);
    setTimeout(renewSession.bind(null, page, delay), delay);
  }
}

function renewSession(page: Page, delay = 240000) {
  const spinner = cli.spinner();
  if (pages.includes(page)) {
    spinner.start('Renewing session');
    page.evaluate(async () => {
      await BBAuthClient.BBAuth.renewSession();
    });
    setTimeout(renewSession.bind(null, page, delay), delay);
    spinner.succeed('Session renewed');
  } else {
    spinner.info('Session no longer active');
  }
}

export function stop(page: Page) {
  const i = pages.findIndex((p) => p === page);
  pages.splice(i, 1);
}
