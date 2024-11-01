import puppeteer from 'puppeteer';

export default async function openURL(
  url: string,
  options: Parameters<typeof puppeteer.launch>[0] = {
    headless: false,
    defaultViewport: { height: 0, width: 0 },
    devtools: true
  }
) {
  const browser = await puppeteer.launch(options);
  const [page] = await browser.pages();
  await page.goto(url);
  return page;
}
