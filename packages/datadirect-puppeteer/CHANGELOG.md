# Changelog

All notable changes to this project will be documented in this file. See [commit-and-tag-version](https://github.com/absolute-version/commit-and-tag-version) for commit guidelines.

## 0.1.0 (2025-01-10)

### Features

- abstract types and Puppeteer session management ([bf1916d](https://github.com/battis/myschoolapp-reporting/commit/bf1916d2b6f8460d430e3caf0341f2810240ae23))
- Add LtiTool API ([7c0e35e](https://github.com/battis/myschoolapp-reporting/commit/7c0e35e1254805098117a531ebc035fad243304d))
- Add schoolinfo API ([019a960](https://github.com/battis/myschoolapp-reporting/commit/019a960848300f66afbf69fb2a6e18c31b65cfb4))
- ContentItem.Content types ([6d99701](https://github.com/battis/myschoolapp-reporting/commit/6d99701dbe30cb93d0a481c3da3f19e1b7b7383f)), closes [#73](https://github.com/battis/myschoolapp-reporting/issues/73)
- **datadirect-puppeteer:** Abstract Puppeteer sessions ([be80d6d](https://github.com/battis/myschoolapp-reporting/commit/be80d6dd0319b14b285887e8f6091e835d25410b))
- **datadirect-puppeteer:** Add api.message.inbox ([c8aefc2](https://github.com/battis/myschoolapp-reporting/commit/c8aefc2a7c3d9525fd8936c1c90aea32e26293f3))
- **datadirect-puppeteer:** Add api.Security ([67d0372](https://github.com/battis/myschoolapp-reporting/commit/67d037291536a622f74cf733e53f61eda7262a67))
- **datadirect-puppeteer:** api.webapp.context ([0dae09b](https://github.com/battis/myschoolapp-reporting/commit/0dae09bf98a3a5ba9250acc4d3ee099af94c0a1a))
- **datadirect-puppeteer:** Authenticated.baseFork() ([43b3018](https://github.com/battis/myschoolapp-reporting/commit/43b3018f9cbdf7691f01b01483257cb0163211c1))
- **datadirect-puppeteer:** Authenticated.decodedToken() ([261ea36](https://github.com/battis/myschoolapp-reporting/commit/261ea36ee27fedf0b24d86101f8a5e7fda15d5cd))
- **datadirect-puppeteer:** Authenticated.user() ([9e033ac](https://github.com/battis/myschoolapp-reporting/commit/9e033acff75d873c005a554ef4d87fa8795815a8))
- **datadirect-puppeteer:** Base.close() ([fe21a0e](https://github.com/battis/myschoolapp-reporting/commit/fe21a0e1d566c5289ceb25226dcc9ea0602564c3))
- **datadirect-puppeteer:** Base.fetch() ([6bc3ad6](https://github.com/battis/myschoolapp-reporting/commit/6bc3ad6addd033224c246f00ce5f040f025b6736))
- **datadirect-puppeteer:** Base.goto() ([1ba83b2](https://github.com/battis/myschoolapp-reporting/commit/1ba83b2b8da20d65245f123953e40dfd274f76e3))
- **datadirect-puppeteer:** Base.url() ([2e0d269](https://github.com/battis/myschoolapp-reporting/commit/2e0d269aa08846968694b6297abdaa3b4cd5a764))
- **datadirect-puppeteer:** Enable richer debugging of bad responses ([d5bbcc0](https://github.com/battis/myschoolapp-reporting/commit/d5bbcc04687123bd0d302eae798d0dae05504e01))
- **datadirect-puppeteer:** Impersonation.userInfo ([9f0f52d](https://github.com/battis/myschoolapp-reporting/commit/9f0f52d9c5b4f76644ccc3174be9e960f4458543)), closes [#191](https://github.com/battis/myschoolapp-reporting/issues/191)
- **datadirect-puppeteer:** logRequests, per-session fetch ([ec0aaef](https://github.com/battis/myschoolapp-reporting/commit/ec0aaefd65823bcd9652f2c69ae0f38687a54e51))
- **datadirect-puppeteer:** PuppeteerSession.Impersonation ([b8a87bc](https://github.com/battis/myschoolapp-reporting/commit/b8a87bc0be6afbad815f0050bf177c5c25765ebe))
- **datadirect-puppeteer:** Simplify detail endpoints ([d1d27e0](https://github.com/battis/myschoolapp-reporting/commit/d1d27e022324beb14308792b736a047757196c81))
- Remove SKY APi dependency, —no-studentData ([92a0902](https://github.com/battis/myschoolapp-reporting/commit/92a0902fd038bfcef5563b6b238c69728ba32b45)), closes [#59](https://github.com/battis/myschoolapp-reporting/issues/59)

### Bug Fixes

- **datadirect-puppeteer:** Add DOM lib to tsconfig ([5dc4a0d](https://github.com/battis/myschoolapp-reporting/commit/5dc4a0dccc185c641c3e39e3b13115bf156d1904))
- **datadirect-puppeteer:** Authenticated.fork() to new page ([169fd96](https://github.com/battis/myschoolapp-reporting/commit/169fd96bddb8a8ff7799f15fdb9835ca8191119c))
- **datadirect-puppeteer:** Include missing ok prop ([3be8b90](https://github.com/battis/myschoolapp-reporting/commit/3be8b903dfdfdd9978ee708c7af07dfcd93708c8))
- **datadirect-puppeteer:** Last tab closes browser (again) ([fc0fd23](https://github.com/battis/myschoolapp-reporting/commit/fc0fd23d4fbfaa483a75116356e1097dbeb1cc68))
- **datadirect-puppeteer:** Late binding to API endpoints ([957b168](https://github.com/battis/myschoolapp-reporting/commit/957b168b25ec8f34b64b1ef5a09b97f5d9e2c464))
- **datadirect-puppeteer:** Simplify api hierarchy and initialization ([185ba13](https://github.com/battis/myschoolapp-reporting/commit/185ba13e43d2cec84a373050401308f9463c703c))
- **datadirect-puppeteer:** Static ContentItems.Content is undefined ([b85b400](https://github.com/battis/myschoolapp-reporting/commit/b85b40005bb0f3ba2586f104a8bfc54714784bd1))
- **datadirect:** Gradebook types ([8b46b58](https://github.com/battis/myschoolapp-reporting/commit/8b46b58a34d8d8de853aeb4d886f5d581ddc6c1e)), closes [#42](https://github.com/battis/myschoolapp-reporting/issues/42) [#69](https://github.com/battis/myschoolapp-reporting/issues/69) [#52](https://github.com/battis/myschoolapp-reporting/issues/52)