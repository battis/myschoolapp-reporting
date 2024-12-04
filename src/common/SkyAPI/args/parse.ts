import { SkyAPICredentials } from '@oauth2-cli/sky-api';

export type Parsed = {
  skyApiOptons: Partial<SkyAPICredentials>;
};

export function parse(values: Record<string, string>): Parsed {
  return {
    skyApiOptons: {
      client_id: values.clientId || process.env.CLIENT_ID,
      client_secret: values.clientSecret || process.env.CLIENT_SECRET,
      redirect_uri: values.redirectUri || process.env.REDIRECT_URI,
      subscription_key: values.subscriptionKey || process.env.SUBSCRIPTION_KEY,
      store: values.tokenPath
    }
  };
}
