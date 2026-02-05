import { ApiError, NetworkError } from '@/lib/errors';

export function handleApiError(
  err: unknown,
  showError: (msg: string) => void,
  context: string,
): void {
  if (err instanceof NetworkError) {
    showError('No connection. Check your internet.');
  } else if (err instanceof ApiError) {
    showError(err.message);
  } else {
    showError(`Unexpected error ${context}`);
  }
}
