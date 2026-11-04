/** Shared request pacing and bounded rate-limit recovery. */
export function abortError(): Error {
  const error = new Error("Request canceled");
  error.name = "AbortError";
  return error;
}

export function waitForRequest(
  ms: number,
  signal?: AbortSignal
): Promise<void> {
  if (signal?.aborted) return Promise.reject(abortError());
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const onAbort = () => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
      reject(abortError());
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

export function retryAfterMs(value: unknown, now = Date.now()): number | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const seconds = Number(value);
  if (String(value).trim() && Number.isFinite(seconds))
    return seconds >= 0 ? seconds * 1000 : null;
  const date = Date.parse(String(value));
  return Number.isFinite(date) ? Math.max(0, date - now) : null;
}

/** One gate per endpoint/provider. Canceled queued requests do not hit the server. */
export function createRequestGate(minIntervalMs = 0) {
  let nextStart = 0;
  let cooldownUntil = 0;
  return async function request<T>(
    operation: () => Promise<T>,
    signal?: AbortSignal
  ): Promise<T> {
    for (let attempt = 0; ; attempt++) {
      // Reserve a start only after waiting: canceled searches do not consume future slots.
      while (true) {
        if (signal?.aborted) throw abortError();
        if (cooldownUntil - Date.now() > 30000)
          throw new Error("Too many requests. Please try again shortly.");
        await waitForRequest(
          Math.max(nextStart, cooldownUntil) - Date.now(),
          signal
        );
        if (signal?.aborted) throw abortError();
        if (Date.now() >= Math.max(nextStart, cooldownUntil)) break;
      }
      nextStart = Date.now() + minIntervalMs;
      try {
        return await operation();
      } catch (error) {
        if (signal?.aborted) throw abortError();
        const response = (
          error as {
            response?: { status?: number; headers?: Record<string, unknown> };
          }
        )?.response;
        const normalized = error as { status?: number; retryAfter?: string };
        const status = response?.status ?? normalized.status;
        if (status !== 429 && status !== 503) throw error;
        const delay =
          retryAfterMs(
            response?.headers?.["retry-after"] ?? normalized.retryAfter
          ) ?? 1000;
        cooldownUntil = Math.max(cooldownUntil, Date.now() + delay);
        // Do not hold the UI indefinitely or retry mutations. This gate is used only for reads.
        if (attempt >= 1 || delay > 30000) throw error;
      }
    }
  };
}
