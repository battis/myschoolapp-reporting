# myschoolapp-reporting

![NPM Version](https://img.shields.io/npm/v/myschoolapp-reporting)

Snapshot course data in Blackbaud's MySchoolApp LMS

This tool was developed to collect the data necessary to generate analytics about how teachers and students are (or are not) using the LMS. It operates by either a) making calls to the old Podium DataDirect front-end API (where possible), or by capturing the data from the updated SKY UX front-end API as it page views are loaded. It does this by using Puppeteer to control Chrome and script all of these interactions. Essentially, you can think of it as "what would happen if I logged in as an admin, clicked around a lot, and took copious notes."

This is a command line tool that depends on [Node.js](https://nodejs.org/) and its (included) `npm` package manager. You need to install Node for this tool to work.

The result of taking a "snapshot" of a course or LMS instance is a JSON file of as much data as can be collected (or as requested).

## Install

You likely want to install this globally:

```sh
npm i -g myschoolapp-reporting
```

However, you could also sandbox it (and its dependencies) in a directory:

```sh
mkdir path/to/workspace
cd path/to/workspace
echo "{}" > package.json
npm i myschoolapp-reporting
```

## Usage

This tool uses a command-and-verb model, in which you invoke the command (`msar`: **M**y**S**chool**A**pp **R**eporting) and give it a verb with the arguments that are desired. The command is invoked using the Node command runner `npx`. For example:

```sh
npx msar snapshot --all https://example.myschoolapp.com
```

At present the following verbs are implemented:

- `snapshot` the course data for one or more classes from the LMS to a JSON data file.
- `download` the supporting files for an existing JSON snapshot file.

For each command, the `--help` (or `-h`) flag provides usage instructions:

```sh
npx msar snaphot --help
```

To capture the course information for a single course:

```sh
npx msar snapshot https://example.myschoolapp.com/app/faculty#academicclass/12345678/0/bulletinboard
```

### Sky API access required for detailed assignment snapshot

Due to recent updates to the way the LMS access assignments, it is more difficult directly query that data. Instead, the list of assignments is requested from the SKY API, and then each assignment is "visited" and the assigment data is captured as it is loaded.

To accomplish this, you will need to create a new Sky API app and enable it. You will need the `client_id`, `client_secret`, `subscription_key` and `redirect_uri` for the app to configure `msar` to get that list of assignments. On the first run, you will be required to authorize the app to access the Sky API using your credentials.

`Details TK`

## Documentation

- [Snapshot Format](./docs/format.md)
- [Cookbook](./docs/cookbook/README.md) of useful data manipulation tricks
