import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Stable per-install UUID. Cleared when app data is cleared → new id → MIR keys can run again.
 */
const STORAGE_KEY = "attribution_install_instance_id";

/** Wall-clock ms when this install was first seen (set once, survives until app data cleared). */
const FIRST_OPEN_AT_KEY = "attribution_first_open_timestamp_ms";

function randomUuidV4(): string {
  const g = globalThis as { crypto?: { randomUUID?: () => string } };
  if (typeof g.crypto?.randomUUID === "function") {
    return g.crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Returns the same id for the lifetime of this app install (until AsyncStorage wiped).
 * Also sets {@link getFirstOpenAtMs} the first time this install id is created, or backfills
 * if missing.
 */
export async function getOrCreateInstallInstanceId(): Promise<string> {
  const now = String(Date.now());
  let id = await AsyncStorage.getItem(STORAGE_KEY);
  if (id != null && id.length > 0) {
    if ((await AsyncStorage.getItem(FIRST_OPEN_AT_KEY)) == null) {
      await AsyncStorage.setItem(FIRST_OPEN_AT_KEY, now);
    }
    return id;
  }
  id = randomUuidV4();
  await AsyncStorage.setItem(FIRST_OPEN_AT_KEY, now);
  await AsyncStorage.setItem(STORAGE_KEY, id);
  return id;
}

/** First app open (install) time in ms since epoch, or null if unknown. */
export async function getFirstOpenAtMs(): Promise<number | null> {
  const v = await AsyncStorage.getItem(FIRST_OPEN_AT_KEY);
  if (v == null || v === "") {
    return null;
  }
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}

/**
 * Milliseconds since first open; 0 if first-open marker missing (should be rare after
 * getOrCreateInstallInstanceId has run).
 */
export async function getTimeSinceFirstOpenMs(): Promise<number> {
  const t = await getFirstOpenAtMs();
  if (t == null) {
    return 0;
  }
  return Math.max(0, Date.now() - t);
}

export function getMetaMirStorageKeys(installId: string): {
  fetchedKey: string;
  cacheKey: string;
  failAttemptsKey: string;
} {
  return {
    fetchedKey: `meta_install_referrer_fetched_${installId}`,
    cacheKey: `meta_mir_attribution_data_${installId}`,
    failAttemptsKey: `meta_mir_native_fail_attempts_${installId}`,
  };
}
