import puppeteer from 'puppeteer';

export async function openURL(
  url: string,
  options: Parameters<typeof puppeteer.launch>[0] = {
    headless: false,
    defaultViewport: { height: 0, width: 0 }
    /*
    // theoeretically this should work, but it seems to have zero impact on actual behavior
    downloadBehavior: {
      policy: 'allowAndName',
      downloadPath: '/desired/path/to/downloads'
    }
    */
  }
) {
  const browser = await puppeteer.launch(options);
  const [page] = await browser.pages();
  await page.goto(url);
  return page;
}
