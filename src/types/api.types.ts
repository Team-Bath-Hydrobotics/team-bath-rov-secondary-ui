/** Typed API error thrown by the API client. */
export interface ApiError extends Error {
  status: number;
}

export function createApiError(status: number, message: string): ApiError {
  const error = new Error(message) as ApiError;
  error.name = 'ApiError';
  error.status = status;
  return error;
}
