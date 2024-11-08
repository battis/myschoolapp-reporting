export default function pathsafeTimestamp() {
  return new Date().toISOString().replace(/[.:/]/g, '-');
}
