declare const BBAuthClient: {
  BBAuth: {
    getUrl: (_: any, _: any) => any;
    getDecodedToken: (_: any) => any;
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

function expand(obj) {
  return Object.keys(obj).reduce((d, key) => {
    switch (typeof obj[key]) {
      case 'function':
        d[key] =
          '(' + new Array(obj[key].length).fill('_: any').join(',') + ')=>any';
        break;
      default:
        d[key] = typeof obj[key];
    }
    return d;
  }, {});
}
