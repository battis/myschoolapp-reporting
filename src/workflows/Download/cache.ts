/*
 * FIXME ditch the cache and use a map and semaphores
 * It's probably more efficient to spider an index and discover all the files
 * that need to be downloaded, build a list of all the places every file needs
 * to go... and then queue all the downloads and apply those mappings. At the
 * moment, we're getting a race condition where all the files are being
 * downloaded and the cache is ignored anyway.
 */
const cache: Record<string, string> = {};

export async function set(url: string, path: string) {
  cache[url] = path;
}

export async function get(url: string) {
  return url in cache ? cache[url] : undefined;
}
