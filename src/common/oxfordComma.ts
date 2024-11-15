export function oxfordComma(list: string[]): string {
  return list.join(', ').replace(/, ([^,]+)$/, ', and $1');
}
