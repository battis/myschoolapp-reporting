# Simple summary of snapshots

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
