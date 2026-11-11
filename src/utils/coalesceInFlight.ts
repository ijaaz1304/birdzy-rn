const inFlight = new Map<string, Promise<unknown>>();

/**
 * If the same key is already running, return that promise instead of starting
 * another call. Used so iOS native-stack fade (focus → blur → focus) does not
 * fire duplicate collection/specimen fetches.
 */
export function coalesceInFlight<T>(
  key: string,
  run: () => Promise<T>
): Promise<T> {
  const existing = inFlight.get(key);
  if (existing) {
    return existing as Promise<T>;
  }
  const pending = run().finally(() => {
    if (inFlight.get(key) === pending) {
      inFlight.delete(key);
    }
  });
  inFlight.set(key, pending);
  return pending;
}

export function resetCoalesceInFlightForTests() {
  inFlight.clear();
}
