# Extract all Zoom links posted to Bulletin Boards

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
