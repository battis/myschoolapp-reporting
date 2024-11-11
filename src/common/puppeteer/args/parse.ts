import { openURL } from '../openURL.js';

type Result = {
  puppeteerOptions: Parameters<typeof openURL>[1];
  quit: boolean;
};

export function parse(values: Record<string, string>): Result {
  const headless = !!values.headless;
  const width = parseInt(values.viewportWidth);
  const height = parseInt(values.viewportHeight);
  const quit = !!values.quit;
  return {
    puppeteerOptions: {
      headless: !!(headless && values.username && values.password),
      defaultViewport: { width, height }
    },
    quit
  };
}
