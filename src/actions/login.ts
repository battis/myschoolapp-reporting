import cli from '@battis/qui-cli';
import { Page } from 'puppeteer';

type LoginOptions = {
  username?: string;
  password?: string;
  sso?: string;
};

export default async function login(
  page: Page,
  { username, password, sso }: LoginOptions = {}
) {
  const spinner = cli.spinner();
  spinner.start('Waiting for interactive login to complete');

  if (username) {
    // Blackbaud username entry
    const userField = await page.waitForSelector('input#Username');
    const nextButton = await page.waitForSelector('input#nextBtn');
    if (userField) {
      await userField.type(username);
      await nextButton?.click();
    }
  }

  if (password) {
    switch (sso) {
      case 'entra-id':
        const passwordField = await page.waitForSelector(
          'input[name="passwd"]'
        );
        const submitButton = await page.waitForSelector('input[type="submit"]');
        if (passwordField) {
          await passwordField.type(password);
          await submitButton?.click();
        }
    }
  }

  await page.waitForSelector('div#site-header', { timeout: 300000 });
  spinner.succeed('Interactive login complete');
}