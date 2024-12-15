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

## Snapshot Format

Snapshots are captured as JSON data, pulled directly from the front-end API requests that build the LMS UI. If capturing a single course (i.e. not using the `--all` flag), the JSON file output is:

```ts
{
  // always included
  Metadata: {
    Host: "example.myschoolapp.com", // base hostname for all relative URLs
    User: "admin@example.com", // email address of user capturing the snapshot
    Start: "2024-12-05T22:59:35.336Z", // human-readable timestamp of snapshot start time,
    Finish: "2024-12-05T22:59:42.212Z" // human-readable timestamp of snapshot finish time,
  },

  // included unless unavailable from the LMS
  SectionInfo?: {
    Id: 12345678, // group ID within the system
    // ... metadata about the group (course, activity, team, advisory…)
  },

  // included unless --no-bulletinBoard flag is used
  BulletinBoard?: [ // list of bulletin board items
    {
      // ... layout information for the content item
      Content: [ // list of content parts (e.g. downloads, links, etc.)
        {
          // ... content data varies by item type
        }
      ]
    }
  ],

  // included unless --no-topics flag is used
  Topics?: [
    {
      // ... topic metadata
      Content: [
        {
          // content data varies by item type
        }
      ]
    }
  ],

  // included unless --no-assignments flag is used
  Assigments?: [
    {
      // assignment data varies by assignment type (discussion, LTI placement, online file submission, etc.)
    }
  ],

  // included unless --no-gradebook flag is used
  Gradebook?: {
    markingPeriods: [
      {
        // marking period data
      }
    ],
    Gradebook: {
      DisplayOptions: {
        // display settings
      },
      Roster: [
        {
          // ... student roster data, including per assigment gradebook data
        }
      ],
      Assignments: [
        {
          // ... assignment data (limited compared to main Assignments list)
        }
      ],
      Summary: {
        // ... gradebook summary data
      },
      Access: {
        // ... access privileges for snapshotting user
      }
    }
  }
}
```

When snapshotting multiple sections (i.e. using the `--all` flag), the snapshot file is an array of snapshots, as described above.

```ts
[
  {
    // ... snapshot data
  }
];
```

## Cookbook

Make sure that you have [`jq`](https://jqlang.github.io/jq/) installed (`brew install jq` is my preferred approach).

### Store credentials in 1Password

If you store your login credentials in 1Password, you can pass username and password using the `op` cli tool (`$OP_ITEM` environment variable is the item identifier in 1Password of the desired login):

```sh
npx msar snapshot -u "$(op item get $OP_ITEM --fields username)" -p "$(op item get $OP_ITEM --fields password --reveal)" --sso "entra-id" https://example.myschoolapp.com/app/faculty#academicclass/97551579/0/bulletinboard
```

The only single sign-on/multi-factor authentication interaction that is currently scripted is Entra ID (for my personal convenience). All other sign-ons and MFA interaction will require running the app _not_ in headless mode (as it is by default, or by invoking it with the `--no-headless` flag) to allow for an interactive login.

### Simple summary of snapshot

```sh
npx msar snapshot --all --outputPath path/to/snapshot.json https://example.myschoolapp.com
jq -r '[ .[] as $section | $section.Topics? // [] | length as $TopicCount | $section.Assignments? // [] | length as $AssignmentCount | $section.BulletinBoard? // [] | length as $BulletinBoardCount | $section.SectionInfo? // {} | . += {$TopicCount, $AssignmentCount, $BulletinBoardCount} ] as $data | $data[0] | keys as $cols | $data | map(. as $row | $cols | map($row[.])) as $rows | $cols, $rows[] | @csv' path/to/snapshot.json > path/to/output.csv
```

That is…

`npx msar snapshot --all`
Snapshot everything…

`--outputPath path/to/snapshot.json`
…write the snapshot file to `path/to/snapshot.json` (if just `/path/to/snapshot/dir`, the snapshot will be automatically timestamped as well)…

`https://example.myschoolapp.com`
…from this particular LMS instance (could be any URL on the instance -- only the host, `example.myschoolapp.com` is used).

Then…

`jq -r`
Parse some JSON and generate "raw" (unescaped, suitable for writing to a file) output…

`'[ .[] as $section`
…start building an array by iterating across every element of the JSON array, referring to the _current_ element as `$section`…

`| $section.Topics? // [] | length as $TopicCount`
…and for each `$section`, if it has a `Topics` property, store its array length as `$TopicCount` (and if it doesn't exist, store the length an empty array)…

`| $section.Assignments? // [] | length as $AssignmentCount | $section.BulletinBoard? // [] | length as $BulletinBoardCount`
…also count assignments and bulletin board items in the same was as topics…

`$section.SectionInfo? // {} | . += {$TopicCount, $AssignmentCount, $BulletinBoardCount}`
…and add these counts to the `SectionInfo` summary if present (or just hang on to them if there is no section info)…

`] as $data`
…and finish that array of arrays and store it as `$data`…

`| $data[0] | keys as $cols`
…and look at the first element of that data and store the property key list as `$cols`…

`| $data | map(. as $row | $cols | map($row[.])) as $rows`
…then iterate through the data and, and for each `$row` make an array of its values (using `$cols` to look yp each value) and store those value array as as `$rows`…

`| $cols, $rows[] | @csv'`
…and put the column names at the top, followed by the rows of values, and format it all as CSV…

`path/to/snapshot.json`
…oh, btw, the JSON we're reading is coming from the snapshot file…

`> path/to/output.csv`
…and we're writing all of the output to `path/to/output.csv`

### Extract all Zoom links posted to Bulletin Boards

```sh
npx msar snapshot --all --no-topics --no-assignments --no-gradebook --outputPath path/to/snapshot.json https://example.myschoolapp.com
jq -r '([ "Section Id", "Url", "ShortDescription" ], .[] as $section | $section.BulletinBoard?[]?.Content?[]? as $content | $content.Url? | select(. != null) | select(contains(".zoom.us")) | [ $section.SectionInfo.Id, $content.Url?, $content.ShortDescription? ]) | @csv' path/to/snapshot.json > path/to/output.csv
```

That is…

`npx msar snapshot --all`
Snapshot everything…

`--no-topics --no-assignments --no-gradebook`
…but don't bother with topics, assignments, or gradebook data…

`--outputPath path/to/snapshot.json`
…write the snapshot file to `path/to/snapshot.json` (if just `/path/to/snapshot/dir`, the snapshot will be automatically timestamped as well)…

`https://example.myschoolapp.com`
…from this particular LMS instance (could be any URL on the instance -- only the host, `example.myschoolapp.com` is used).

Then…

`jq -r`
Parse some JSON and generate "raw" (unescaped, suitable for writing to a file) output…

`'([ "Section Id", "Url", "ShortDescription" ],`
…starting with column labels…

`.[] as $section`
…then iterate across every element of the JSON array, referring to the _current_ element as `$section`…

`| $section.BulletinBoard?[]?.Content?[]? as $content`
…iterate across every bulletin board item's content in `$section`, referring to the _current_ bulletin board item as `$content`…

`| $content.Url? | select(. != null) | select(contains(".zoom.us"))`
…filter those elements to select only those that are both not `null` and whose value contains `".zoom.us"`…

`| [ $section.SectionInfo.Id, $content.Url?, $content.ShortDescription? ])`
…for each of these filtered links, build an array made of up the section ID, the URL, and the short description of the URL…

`| @csv'`
…and format this list of arrays as CSV…

`path/to/snapshot.json`
…oh, btw, the JSON we're reading is coming from the snapshot file…

`> path/to/output.csv`
…and we're writing all of the output to `path/to/output.csv`

### Retry a batch of failed snapshots

Suppose you attempt to snapshot a bunch of sections:

```sh
npx msar snapshot ...args... --all "https://example.myschoolapp.com"
```

If any snapshots fail, in addition to your expected `snapshot.json` file there will also be a `snapshot.errors.json` file.

```sh
jq -r '.[].lead_pk' "snapshot.errors.json" | xargs -I % npx msar snapshot ...args... "https://example.myschoolapp.com/app/faculty#academicclass/%/0/bulletinboard"
cp snapshot.json snapshot.bak.json
find . -name <pattern> -exec jq '. + [ inputs ]' snapshot.json {} + > snapshot.json
```

…where `<pattern>` matches the individual snapshot filenames. For example, if I had create a bunch of snapshots from 2021-2022, the pattern might be `'2021 - 2022*[0-9].json'` that is: capturing all the files that start with that year, and that end with a Group ID number before the `.json` file extension (excluding the `*.metadata.json` files that might also be present).

That is…

`jq -r '.[].lead_pk' "snapshot.errors.json"`
Extract the list of group ID numbers from `snapshot.errors.json`…

`| xargs -I %`
…pass that list into `xargs` one at time, to execute the next command, replacing the `%` in the command with the actual group ID number…

`npx msar snapshot ...args... "https://example.myschoolapp.com/app/faculty#academicclass/%/0/bulletinboard"`
…and take a snapshot (with the same options as before) but _without_ the `--all` flag (i.e. snapshotting a single course) for which we are building the URL.

Then…
`cp snapshot.json snapshot.bak.json`
Make a backup of our original snapshot, in case we botch something when we overwrite it.

Then…
`find . -name <pattern>`
Find all the snapshot files matching a pattern (see above)…

`-exec jq '. + [ inputs ]' snapshot.json {} +`
Execute the `jq` command passing in all of those file names as additional arguments (`{} +`), and add each of the individual snapshots to the main snapshot list…

`> snapshot.json`
…writing the updated snapshot list to our `snapshot.json` file.
