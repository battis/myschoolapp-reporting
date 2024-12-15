# myschoolapp-reporting

## 0.4.1

### Patch Changes

- 04a69ce: Download fixes

  - Fix broken URL normalization in Cache
  - Handle pre-2021 courses that store paths in *FilePath fields as well as/instead of *Url fields

## 0.4.0

### Minor Changes

- ae093fa: Improved reliability

## 0.3.3

### Patch Changes

- cc1298e: Significantly more robust download

## 0.3.2

### Patch Changes

- d6aefbd: remove extraneous dependencies

## 0.3.1

### Patch Changes

- ef3633e: Improved, but not perfect, downloading

  It turns out that even if you tell Chrome to download to a specific directory, it's possible that it... just won't. Unclear if this is someting erroneous in this script or in Chrome. Many, but not all, downloads are now recovered from the ~/Downloads folder (on macOS). Error messages remaining in the download index provide information about how to merge in the files not captured from ~/Downloads.

## 0.3.0

### Minor Changes

- b08beae: Download everything

## 0.2.6

### Patch Changes

- 8221aa5: fix qui-cli dependency

## 0.2.5

### Patch Changes

- 60d3099: more documentation tweaks

## 0.2.4

### Patch Changes

- 3fe6f7e: tweak wording

## 0.2.3

### Patch Changes

- 521254e: improve documentation

## 0.2.2

### Patch Changes

- faee14a: fix credentials error

## 0.2.1

### Patch Changes

- b02bc5e: fix build

## 0.2.0

### Minor Changes

- a770f06: assigments, updated snapshot metadata

## 0.1.3

### Patch Changes

- c3f2ab0: package info

## 0.1.2

### Patch Changes

- e5b4780: fix ignores

## 0.1.1

### Patch Changes

- b580e64: fix paths

## 0.1.0

### Minor Changes

- aa409d6: Initial release
