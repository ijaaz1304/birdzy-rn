/**
 * Android Play Install Referrer — cache + native bridge.
 *
 * Limitations:
 * - Only meaningful for installs from Google Play (not adb/sideload).
 * - Attribution is best-effort per device; reinstall / clear data may run again.
 */

import { NativeModules, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const INSTALL_REFERRER_STORAGE_KEY = "install_referrer_data";

export type InstallReferrerPayload = {
  installReferrer: string;
  /** Referrer **click** time from Play API, milliseconds (`ReferrerDetails.getReferrerClickTimestampSeconds() * 1000`). */
  clickTimestamp: number;
  /** Install begin time from Play API, milliseconds — fallback only if click time is unusable. */
  installTimestamp: number;
  platform: "android";
};

function normalizeRaw(raw: {
  installReferrer?: string;
  clickTimestamp?: number;
  installTimestamp?: number;
}): InstallReferrerPayload {
  return {
    installReferrer: String(raw.installReferrer ?? ""),
    clickTimestamp: Number(raw.clickTimestamp ?? 0),
    installTimestamp: Number(raw.installTimestamp ?? 0),
    platform: "android",
  };
}

/**
 * Persist referrer payload (used after successful native fetch in attribution manager).
 */
export async function persistInstallReferrerData(
  data: InstallReferrerPayload
): Promise<void> {
  await AsyncStorage.setItem(
    INSTALL_REFERRER_STORAGE_KEY,
    JSON.stringify(data)
  );
}

/**
 * Fetch from native only (no AsyncStorage). Does not throw; returns null on failure.
 */
export async function fetchInstallReferrerFromNative(): Promise<InstallReferrerPayload | null> {
  if (Platform.OS !== "android") {
    return null;
  }
  try {
    const mod = NativeModules.InstallReferrerModule as
      | { getReferrer?: () => Promise<Record<string, unknown>> }
      | undefined;
    if (!mod?.getReferrer) {
      if (__DEV__) {
        console.warn(
          "[Attribution][GPIR] InstallReferrerModule.getReferrer missing"
        );
      }
      return null;
    }
    const raw = await mod.getReferrer();
    return normalizeRaw(raw as Record<string, unknown>);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : String(error ?? "unknown");
    const code =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code != null
        ? String((error as { code: string }).code)
        : undefined;
    if (__DEV__) {
      console.warn("[Attribution][GPIR] native getReferrer error", {
        message,
        code: code ?? null,
      });
    }
    return null;
  }
}

/**
 * Returns cached referrer or fetches once from native and caches on success.
 * On failure returns null (does not throw).
 */
export async function getInstallReferrer(): Promise<InstallReferrerPayload | null> {
  if (Platform.OS !== "android") {
    return null;
  }
  try {
    const cached = await AsyncStorage.getItem(INSTALL_REFERRER_STORAGE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached) as InstallReferrerPayload;
      if (
        parsed &&
        typeof parsed.installReferrer === "string" &&
        typeof parsed.clickTimestamp === "number" &&
        typeof parsed.installTimestamp === "number"
      ) {
        return { ...parsed, platform: "android" };
      }
    }

    const fresh = await fetchInstallReferrerFromNative();
    if (fresh) {
      await persistInstallReferrerData(fresh);
    }
    return fresh;
  } catch {
    return null;
  }
}
