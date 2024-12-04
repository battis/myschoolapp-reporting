import { SkyAPI, SkyAPICredentials } from '@oauth2-cli/sky-api';
import { Mutex } from 'async-mutex';
import { Parsed } from './args.js';

let sky: SkyAPI | undefined = undefined;
let singletonMutex = new Mutex();

export async function init(credentials: Parsed['skyApiOptons']) {
  await singletonMutex.acquire();
  if (!sky) {
    if (verify(credentials)) {
      sky = new SkyAPI(credentials);
    }
  }
  singletonMutex.release();
  return sky;
}

function verify(
  credentials: Parsed['skyApiOptons']
): credentials is SkyAPICredentials {
  if (!credentials.client_id) {
    throw new Error('Missing required client_id argument');
  }
  if (!credentials.client_secret) {
    throw new Error('Missing required client_secret argument');
  }
  if (!credentials.subscription_key) {
    throw new Error('Missing required subscription_key argument');
  }
  if (!credentials.redirect_uri) {
    throw new Error('Missing required redirect_uri argument');
  }
  return true;
}

export async function fetch(...args: Parameters<SkyAPI['fetch']>) {
  if (!sky) {
    throw new Error('SKY API not initialized');
  }
  return sky.fetch(...args);
}
