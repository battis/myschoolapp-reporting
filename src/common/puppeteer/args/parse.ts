import { openURL } from '../openURL.js';

export type Parsed = {
  puppeteerOptions: Parameters<typeof openURL>[1];
  loginCredentials: { username?: string; password?: string; sso?: string };
  quit: boolean;
};

export function parse(values: Record<string, string>): Parsed {
  const headless = !!values.headless;
  const width = parseInt(values.viewportWidth);
  const height = parseInt(values.viewportHeight);
  const quit = !!values.quit;
  return {
    puppeteerOptions: {
      headless: !!(headless && values.username && values.password),
      defaultViewport: { width, height }
    },
    loginCredentials: {
      username: values.username,
      password: values.password,
      sso: values.sso
    },
    quit
  };
}
