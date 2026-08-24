/**
 * Dev-only location pipeline logging.
 * Filter Metro / DevTools logs with: [LOCATION]
 */

const LOG_PREFIX = "[LOCATION]";

export function logLocation(
  step: string,
  data?: Record<string, unknown> | string | number | boolean | null
): void {
  if (!__DEV__) return;

  if (data === undefined) {
    console.log(LOG_PREFIX, step);
    return;
  }

  if (typeof data === "object" && data !== null) {
    console.log(LOG_PREFIX, step, JSON.stringify(data, null, 2));
    return;
  }

  console.log(LOG_PREFIX, step, data);
}

export function logLocationError(
  step: string,
  error: unknown,
  extra?: Record<string, unknown>
): void {
  if (!__DEV__) return;

  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error !== null && "message" in error
      ? String((error as { message: unknown }).message)
      : String(error);

  const code =
    typeof error === "object" && error !== null && "code" in error
      ? (error as { code: unknown }).code
      : undefined;

  console.warn(LOG_PREFIX, step, {
    message,
    code,
    ...extra,
  });
}
