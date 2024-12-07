import cli from '@battis/qui-cli';
import { Page } from 'puppeteer';
import { isReady } from './isReady.js';

const timeout = 300000;

type LoginOptions = {
  username?: string;
  password?: string;
  sso?: string;
};

export async function login(
  page: Page,
  { username, password, sso }: LoginOptions = {}
) {
  const spinner = cli.spinner();
  spinner.start('Waiting for login to complete');

  if (username) {
    // Blackbaud username entry
    const userField = await page.waitForSelector('input#Username', { timeout });
    const nextButton = await page.waitForSelector('input#nextBtn');
    if (userField) {
      await userField.type(username);
      await nextButton?.click();
    }
  }

  if (password) {
    if (sso == 'entra-id') {
      const passwordField = await page.waitForSelector('input[name="passwd"]', {
        timeout
      });
      const submitButton = await page.waitForSelector('input[type="submit"]');
      if (passwordField) {
        await passwordField.type(password);
        await submitButton?.click();
      }
    }
  }

  await isReady(page, timeout);
  spinner.succeed('Login complete');
}
