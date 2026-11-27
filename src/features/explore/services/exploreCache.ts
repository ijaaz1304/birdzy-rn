/** Bounded in-memory cache; reads reorder LRU entries without extending their age. */
export const EXPLORE_CACHE_TTL_MS = 3 * 60 * 1000;
export function createExploreCache<T>(limit = 12) {
  const entries = new Map<string, { value: T; at: number }>();
  return {
    get(key: string) {
      const entry = entries.get(key);
      if (!entry) return;
      entries.delete(key);
      if (Date.now() - entry.at >= EXPLORE_CACHE_TTL_MS) return;
      entries.set(key, entry);
      return entry;
    },
    set(key: string, value: T) {
      entries.delete(key);
      entries.set(key, { value, at: Date.now() });
      if (entries.size > limit) entries.delete(entries.keys().next().value!);
    },
    clear: () => entries.clear(),
  };
}
