/**
 * Utility functions for safe error handling with TypeScript.
 * Use these instead of `error: any` to maintain type safety.
 */

/**
 * Extracts a human-readable message from an unknown error.
 * Works with Error objects, strings, and Supabase errors.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (
    error !== null &&
    typeof error === 'object' &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  ) {
    return (error as { message: string }).message;
  }
  return 'Ein unbekannter Fehler ist aufgetreten';
}

/**
 * Type guard to check if an error has a specific error code.
 * Useful for Supabase PostgreSQL errors.
 */
export function hasErrorCode(error: unknown, code: string): boolean {
  return (
    error !== null &&
    typeof error === 'object' &&
    'code' in error &&
    (error as { code: unknown }).code === code
  );
}

/**
 * Logs an error safely and returns the message.
 * Use in catch blocks for consistent error handling.
 */
export function handleError(error: unknown, context?: string): string {
  const message = getErrorMessage(error);
  if (context) {
    console.error(`[${context}]`, error);
  } else {
    console.error(error);
  }
  return message;
}
