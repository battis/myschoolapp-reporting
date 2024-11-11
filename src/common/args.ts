import * as OAuth2 from './OAuth2/args.js';
import * as output from './output/args.js';
import * as puppeteer from './puppeteer/args.js';

export const flags = {
  ...OAuth2.flags,
  ...output.flags,
  ...puppeteer.flags
};

export const options = {
  ...OAuth2.options,
  ...output.options,
  ...puppeteer.options
};

export function parse(values: Record<string, string>) {
  return {
    ...OAuth2.parse(values),
    ...output.parse(values),
    ...puppeteer.parse(values)
  };
}
