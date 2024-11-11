import { Page } from 'puppeteer';

export async function isReady(page: Page, timeout = 30000) {
  await page.waitForSelector('div#site-header', { timeout });
}
