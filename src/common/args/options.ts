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
  outputPath: {
    short: 'o',
    description: `Path to output directory or file to save command output (include placeholder ${cli.colors.quotedValue('"%TIMESTAMP%"')} to specify its location, otherwise it is added automatically when needed to avoid overwriting existing files)`
  }
};
