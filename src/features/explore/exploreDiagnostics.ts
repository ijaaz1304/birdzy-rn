/** Development-only, bounded counters. Never retain query bodies, locations, IDs or URLs. */
type ReadKind = "map" | "list";
type CacheKind = ReadKind | "page";
type Metric =
  | `${ReadKind}-${"start" | "success" | "failure" | "canceled"}`
  | `${CacheKind}-cache-${"hit" | "miss"}`;
type Sample = { count: number; totalMs: number; lastMs: number };
const samples = new Map<Metric, Sample>();

export function recordExploreMetric(metric: Metric, durationMs = 0): void {
  if (!__DEV__) return;
  const previous = samples.get(metric);
  samples.set(metric, {
    count: (previous?.count ?? 0) + 1,
    totalMs: (previous?.totalMs ?? 0) + durationMs,
    lastMs: durationMs,
  });
}

/** Read/reset from development tooling to compare identical interactions. */
export const getExploreDiagnostics = () =>
  Object.fromEntries(
    [...samples].map(([name, sample]) => [name, { ...sample }])
  );
export const resetExploreDiagnostics = () => samples.clear();

/** Called inside the gate, at actual Axios dispatch, not at service entry. */
export async function measureExploreRead<T>(
  kind: ReadKind,
  read: () => Promise<T>,
  signal?: AbortSignal
): Promise<T> {
  const started = Date.now();
  recordExploreMetric(`${kind}-start`);
  try {
    const result = await read();
    recordExploreMetric(`${kind}-success`, Date.now() - started);
    return result;
  } catch (error) {
    recordExploreMetric(
      `${kind}-${signal?.aborted ? "canceled" : "failure"}`,
      Date.now() - started
    );
    throw error;
  }
}
