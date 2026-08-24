/**
 * Retry with exponential backoff (e.g. for subscription backend calls).
 * Matches backend contract: maxRetries, baseDelay, maxDelay, backoffMultiplier.
 */

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute an async function with exponential backoff retry.
 * On failure, waits baseDelay * (backoffMultiplier ^ attempt) before retry, capped at maxDelay.
 */
export async function executeWithRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: unknown;
  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt === opts.maxRetries) {
        throw err;
      }
      const waitMs = Math.min(
        opts.baseDelay * Math.pow(opts.backoffMultiplier, attempt),
        opts.maxDelay
      );
      await delay(waitMs);
    }
  }
  throw lastError;
}
