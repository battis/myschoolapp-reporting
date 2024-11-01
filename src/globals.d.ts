declare const BBAuthClient: {
  BBAuth: {
    getUrl;
    getDecodedToken;
    getToken;
    getTTL;
    renewSession: () => Promise<string>;
    clearTokenCache;
    getTokenInternal;
    mock;
    tokenCache;
  };
  BBAuthTokenErrorCode: {};
  BBContextProvider: {};
  BBOmnibar: {};
  BBUserSettings: {};
};
