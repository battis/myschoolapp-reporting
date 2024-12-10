---
'myschoolapp-reporting': patch
---

Improved, but not perfect, downloading

It turns out that even if you tell Chrome to download to a specific directory, it's possible that it... just won't. Unclear if this is someting erroneous in this script or in Chrome. Many, but not all, downloads are now recovered from the ~/Downloads folder (on macOS). Error messages remaining in the download index provide information about how to merge in the files not captured from ~/Downloads.
