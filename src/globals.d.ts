type DecodedToken = {
  sub: UUIDString;
  email: EmailString;
  given_name: string;
  family_name: string;
  '1bb.session_id': string;
  exp: NumericTimestamp;
  iat: NumericTimestamp;
  iss: URLString;
  aud: string;
};

declare const BBAuthClient: {
  BBAuth: {
    getUrl: (_: any, _: any) => any;
    getDecodedToken: (_: any) => Promise<DecodedToken>;
    getToken: (_: any) => any;
    getTTL: () => any;
    renewSession: () => any;
    clearTokenCache: () => any;
    getTokenInternal: (_: any) => any;
    mock: boolean;
    tokenCache: {
      'token|-|p-Lt494RXl5kWrYUzNJonm3g|bem-legacy': {
        pendingLookupPromise: Promise;
        expirationTime: number;
        lastToken: string;
      };
    };
  };
  BBAuthTokenErrorCode: {
    0: string;
    1: string;
    2: string;
    3: string;
    4: string;
    Unspecified: number;
    NotLoggedIn: number;
    InvalidEnvironment: number;
    PermissionScopeNoEnvironment: number;
    Offline: number;
  };
  BBContextProvider: {
    ensureContext: (_: any) => any;
    url: string;
  };
  BBOmnibar: {
    load: (_: any) => any;
    update: (_: any) => any;
    setTitle: (_: any) => any;
    moveFocusTo: (_: any) => any;
    pushNotificationsEnabled: () => any;
    destroy: () => any;
  };
  BBUserSettings: {
    getSettings: () => any;
    updateSettings: (_: any, _: any) => any;
    getLocalSettings: () => any;
    UPDATE_DELAY: number;
    GET_SETTINGS_TIMEOUT: number;
    LOCAL_STORAGE_KEY: string;
  };
};
