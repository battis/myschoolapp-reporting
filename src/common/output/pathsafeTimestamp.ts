export function pathsafeTimestamp(date?: Date | string) {
  return (date ? new Date(date) : new Date())
    .toISOString()
    .replace(/[.:/]/g, '-');
}
