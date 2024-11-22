import cli from '@battis/qui-cli';
import { Mutex } from 'async-mutex';
import * as oauth from 'oauth2-cli';
import * as args from './args.js';

let tokenManager: oauth.TokenManager;
let singletonMutex = new Mutex();

export async function getToken(options: args.Parsed['oauthOptions']) {
  await singletonMutex.runExclusive(async () => {
    if (!tokenManager) {
      if (verify(options)) {
        tokenManager = new oauth.TokenManager(options);
      } else {
        throw new Error('OAuth 2.0 credentials could not be verified');
      }
    }
  });
  return tokenManager.getToken();
}

function verify(
  options: args.Parsed['oauthOptions']
): options is ConstructorParameters<typeof oauth.TokenManager>[0] {
  if (!options.client_id) {
    throw new Error(`${cli.colors.value('client_id')} must be defined`);
  }
  if (!options.client_secret) {
    throw new Error(`${cli.colors.value('client_secret')} must be defined`);
  }
  if (!options.redirect_uri) {
    throw new Error(`${cli.colors.value('redirect_uri')} must be defined`);
  }
  if (!options.headers || (options.headers['Bb-api-subscription-key'] = '')) {
    throw new Error(
      `Header ${cli.colors.value('Bb-api-subscription-key')} must be defined`
    );
  }
  return true;
}
