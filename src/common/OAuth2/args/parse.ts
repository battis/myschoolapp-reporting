import * as oauth from 'oauth2-cli';

export type Parsed = {
  oauthOptions: Partial<ConstructorParameters<typeof oauth.TokenManager>[0]>;
};

export function parse(values: Record<string, string>): Parsed {
  return {
    oauthOptions: {
      client_id: values.clientId || process.env.CLIENT_ID,
      client_secret: values.clientSecret || process.env.CLIENT_SECRET,
      redirect_uri: values.redirectUri || process.env.REDIRECT_URI,
      headers: {
        'Bb-api-subscription-key':
          values.subscriptionKey || process.env.SUBSCRIPTION_KEY || ''
      },
      authorization_endpoint: 'https://app.blackbaud.com/oauth/authorize',
      token_endpoint: 'https://oauth2.sky.blackbaud.com/token',
      store: values.tokenPath
    }
  };
}
