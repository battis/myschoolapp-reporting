import cli from '@battis/qui-cli';

export default {
  username: {
    short: 'u',
    description: 'MySchoolApp username'
  },
  password: {
    short: 'p',
    description: 'MySchoolApp password'
  },
  sso: {
    description: `MySchoolApp SSO configuration (currently only accepts ${cli.colors.quotedValue('"entra-id"')})`
  },
  viewportWidth: {
    default: '0'
  },
  viewportHeight: {
    default: '0'
  },
  output: {
    short: 'o',
    description: 'Path to output file'
  }
};
