import * as SkyAPI from './SkyAPI/args.js';
import * as output from './output/args.js';
import * as puppeteer from './puppeteer/args.js';

export const flags = {
  ...SkyAPI.flags,
  ...output.flags,
  ...puppeteer.flags
};

export const options = {
  ...SkyAPI.options,
  ...output.options,
  ...puppeteer.options
};

export function parse(values: Record<string, string>) {
  return {
    ...SkyAPI.parse(values),
    ...output.parse(values),
    ...puppeteer.parse(values)
  };
}
