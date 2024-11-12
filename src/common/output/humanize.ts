import { Page } from 'puppeteer';
import { isReady } from '../puppeteer.js';

export async function humanize(page: Page, url: string) {
  await page.goto(url);
  await isReady(page);
}
