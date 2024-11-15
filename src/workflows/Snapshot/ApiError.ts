export type ApiError = {
  error: any; // FIXME type
};

export function isApiError(o: unknown): o is ApiError {
  return typeof o === 'object' && o !== null && 'error' in o;
}
