# Retry a batch of failed snapshots

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
