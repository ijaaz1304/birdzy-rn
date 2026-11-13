export type BackendAiUsage = {
  successCount: number;
  errorCount: number;
  successThreshold: number;
  errorThreshold: number;
  resetsAtSuccess?: null;
  resetsAtError?: number | null;
};

type Snapshot = { usage: BackendAiUsage; request: number; receivedAt: number };
const snapshots = new Map<string, Snapshot>();
const listeners = new Set<() => void>();
let requestSequence = 0;

export const nextAiUsageRequest = () => ++requestSequence;
export const getBackendAiUsage = (identity: string) => snapshots.get(identity);

export function parseBackendAiUsage(value: unknown): BackendAiUsage | null {
  if (!value || typeof value !== "object") return null;
  const data = value as Record<string, unknown>;
  const fields = [
    "successCount",
    "errorCount",
    "successThreshold",
    "errorThreshold",
  ] as const;
  if (
    !fields.every(
      (field) =>
        typeof data[field] === "number" &&
        Number.isSafeInteger(data[field]) &&
        (data[field] as number) >= 0
    )
  )
    return null;
  return {
    successCount: data.successCount as number,
    errorCount: data.errorCount as number,
    successThreshold: data.successThreshold as number,
    errorThreshold: data.errorThreshold as number,
    resetsAtSuccess: null,
    resetsAtError:
      typeof data.resetsAtError === "number" ? data.resetsAtError : null,
  };
}

export function updateBackendAiUsage(
  identity: string,
  response: unknown,
  request: number
): void {
  const usage = parseBackendAiUsage(response);
  if (!identity || !usage || (snapshots.get(identity)?.request ?? -1) > request)
    return;
  snapshots.set(identity, { usage, request, receivedAt: Date.now() });
  listeners.forEach((listener) => listener());
}

export function subscribeBackendAiUsage(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function aiUsagePayload(error: unknown): unknown {
  if (!error || typeof error !== "object") return error;
  const value = error as {
    data?: unknown;
    payload?: unknown;
    response?: { data?: unknown };
  };
  return value.response?.data ?? value.payload ?? value.data ?? error;
}
export function isAiLifetimeLimitError(error: unknown): boolean {
  const payload = aiUsagePayload(error) as { aiErrorCode?: string } | null;
  return (
    payload?.aiErrorCode === "E004" ||
    (error as { aiErrorCode?: string } | null)?.aiErrorCode === "E004"
  );
}

export function clearBackendAiUsage(): void {
  snapshots.clear();
  listeners.forEach((listener) => listener());
}
