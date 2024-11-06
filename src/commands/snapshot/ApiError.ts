export type ApiError = {
  error: any;
};

export function isApiError(o: unknown): o is ApiError {
  return typeof o === 'object' && o !== null && 'error' in o;
}
