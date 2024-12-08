import { Mutex } from 'async-mutex';
import { Page } from 'puppeteer';
import * as common from '../../../../common.js';

export type Credentials =
  | (common.puppeteer.args.Parsed['loginCredentials'] & { host: string })
  | undefined;

let parent: Page | undefined = undefined;

const loggingIn = new Mutex();
let _credentials: Credentials = undefined;

export function init(credentials: Credentials) {
  _credentials = credentials;
}

export async function get() {
  await loggingIn.acquire();
  if (!parent) {
    if (!_credentials) {
      throw new Error('No host provided');
    }
    const { host, ...loginCredentials } = _credentials;
    parent = await common.puppeteer.openURL(`https://${host}`);
    await common.puppeteer.login(parent, loginCredentials);
  }
  loggingIn.release();
  return parent;
}

export async function quit() {
  if (parent) {
    await parent.close();
  }
}
