# myschoolapp-reporting

Snapshot course data in Blackbaud's MySchoolApp LMS

## Install

```sh
npm i -g myschoolapp-reporting
```

## Usage

Get command arguments:

```sh
npx snapshot --help
```

Basic invocation (URL to any course page/tab should work):

```sh
npx snapshot https://groton.myschoolapp.com/app/faculty#academicclass/97551579/0/bulletinboard
```

Pass username and password from 1Password using op cli tool (`$OP_ITEM` environment variable is the item identifier in 1Password of the desired login):

```sh
npx snapshot -u "$(op item get $OP_ITEM --fields username)" -p "$(op item get $OP_ITEM --fields password --reveal)" --sso "entra-id" https://groton.myschoolapp.com/app/faculty#academicclass/97551579/0/bulletinboard
```
