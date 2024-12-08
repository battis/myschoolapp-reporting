import path from 'node:path';

export class Item {
  public readonly url: string;
  public readonly localPath?: string;
  public readonly filename?: string;
  public readonly error?: string;

  public constructor(
    snapshotComponent: object,
    key: keyof typeof snapshotComponent,
    fetchUrl: string,
    filename?: string
  ) {
    this.url = snapshotComponent[key];
    this.localPath = new URL(fetchUrl).pathname.slice(1);
    this.filename = filename || path.basename(snapshotComponent[key]);
  }
}
