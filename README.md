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
npx msar snapshot https://example.myschoolapp.com/app/faculty#academicclass/97551579/0/bulletinboard
```

If you store your login credentials in 1Password, you can pass username and password using `op` cli tool (`$OP_ITEM` environment variable is the item identifier in 1Password of the desired login):

```sh
npx msar snapshot -u "$(op item get $OP_ITEM --fields username)" -p "$(op item get $OP_ITEM --fields password --reveal)" --sso "entra-id" https://example.myschoolapp.com/app/faculty#academicclass/97551579/0/bulletinboard
```

The only single sign-on/multi-factor authentication interaction that is currently scripted is Entra ID (for my personal convenience). All other sign-ons and MFA interaction will require running the app _not_ in headless mode (as it is by default, or by invoking it with the `--no-headless` flag) to allow for an interactive login.

## Cookbook

Make sure that you have [`jq`](https://jqlang.github.io/jq/) installed (`brew install jq` is my preferred approach).

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
