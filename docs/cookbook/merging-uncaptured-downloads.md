# Manually merging uncaptured downloads

This can probably be scripted, but I have not bothered to do so yet, since my experience has been that only about 8-12 downloads for an entire year of courses are going astray at this point.

Having run `npx msar download`… (with the `--pretty` flag, ideally)

1. Open the default downloads directory for Chrome `$HOME/Downloads` in the Finder/File Explorer
2. Open `path/to/downloads/directory/index.json` (in a text editor that can handle several million lines of text, e.g. TextMate)
3. Search for `error":[` (or `error": [` if the `--pretty` flag was used)
4. Use the metadata (especially `FriendlyFileName`) to identify the matching file in the downloads directory. Often it is the friendly filename with a counter (` (1)`) appended.
5. Rename the identified file to match the URL (e.g. `download_12345678.pdf`)
6. Move the identified file into place in `/path/to/downloads/directory` (e.g. '`./ftpimages/123/downloads/')
7. Update the `error` metadata to replace the `error` property with `localPath` (the relative path from `index.json` to the actual file moved in #6) and `filename` properties (usually `FriendlyFileName` or the original name of the downloaded file from #4)
8. Copy the `localPath` and `filename` properties and search for other occurrences of the `original` property (which will have an identical `error`). Replace _those_ `error` properties with the copied `localPath` and `filename` properties.
9. Repeat from #3 until no more instances are found.
