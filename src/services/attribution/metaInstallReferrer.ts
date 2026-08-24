import { NativeModules, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  getMetaMirStorageKeys,
  getOrCreateInstallInstanceId,
} from "./installInstance";

/**
 * Meta Install Referrer (ContentProvider on device). Complements Google Play Install Referrer
 * with view-through and multi-session click-through when Meta apps expose the provider.
 *
 * Meta expects the ContentProvider to be queried only once per **install**; we persist a
 * per-install-instance flag + cache (see `getOrCreateInstallInstanceId`). Clearing app data
 * generates a new install id → MIR can run again.
 *
 * Requires `META_INSTALL_REFERRER_DECRYPTION_KEY` at native build time (Meta dashboard).
 */

export const META_MIR_CACHE_EMPTY = "__mir_empty__";

const NATIVE_MIR_TIMEOUT_MS = 8000;

/** Set true only in JS timeout path of native invoke; read in fetch for [MIR][RESULT] / hardening. */
let mirLastNativeInvokeTimedOut = false;

/** Increments on each `logMirResult` call — used to detect missing `[MIR][RESULT]` from `resolveMetaMirAttribution`. */
let mirResultLogInvocationCount = 0;

/**
 * Visible in Metro (dev) and `adb logcat -s ReactNativeJS` (release) so MIR can be traced without opening App Logs.
 * App log store only mirrors to console in `__DEV__` (see app-logs.store.ts).
 */
/** Exported for attribution orchestration tracing (logcat + App Logs). */
export function mirDiagTrace(
  message: string,
  metadata?: Record<string, unknown>
): void {
  // Intentionally no-op in production-safe mode to avoid verbose trace spam.
  void message;
  void metadata;
}

export type MirHardeningSnapshot = {
  /** True if native getMetaReferrer was invoked (not cache short-circuit). */
  native_invoked: boolean;
  /** True if a valid MetaMirAttribution was produced (cache or native). */
  has_payload: boolean;
  last_native_error_reason: string | null;
  from_cache: boolean;
};

const mirHardening: MirHardeningSnapshot = {
  native_invoked: false,
  has_payload: false,
  last_native_error_reason: null,
  from_cache: false,
};

/**
 * Call once at the start of each attribution run (before resolve) so FINAL log is per-run.
 */
export function resetMirAttributionHardeningState(): void {
  mirHardening.native_invoked = false;
  mirHardening.has_payload = false;
  mirHardening.last_native_error_reason = null;
  mirHardening.from_cache = false;
  mirLastNativeInvokeTimedOut = false;
}

export function getMirAttributionHardeningSnapshot(): Readonly<MirHardeningSnapshot> {
  return { ...mirHardening };
}

function isDebugMockMirEnabled(): boolean {
  if (!__DEV__) {
    return false;
  }
  return !!(globalThis as { ATTRIBUTION_DEBUG_FORCE_MIR?: boolean })
    .ATTRIBUTION_DEBUG_FORCE_MIR;
}

function buildDebugMockMirAttribution(): MetaMirAttribution {
  const nowSec = Math.floor(Date.now() / 1000);
  const json = JSON.stringify({
    campaign_id: "attribution_debug_mock",
    ad_id: "0",
    adgroup_id: "0",
  });
  return {
    raw: json,
    utm_source: "apps.facebook.com",
    utm_medium: "cpc",
    utm_campaign: "attribution_debug_mock",
    campaign_id: "attribution_debug_mock",
    campaign_name: "attribution_debug_mock",
    ad_id: "0",
    adgroup_id: "0",
    account_id: "0",
    publisher_platform: "facebook",
    is_instagram: false,
    is_an: false,
    actual_timestamp_sec: nowSec,
    is_click_through: true,
  };
}

/** Max native MIR attempts per install when attribution is null (avoids hammering ContentProvider). */
const MAX_MIR_NATIVE_FAIL_ATTEMPTS = 2;

export type MetaMirAttribution = {
  raw: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  campaign_id: string;
  campaign_name: string;
  ad_id: string;
  adgroup_id: string;
  account_id: string;
  publisher_platform: string;
  adset_id?: string;
  adset_name?: string;
  campaign_group_id?: string;
  campaign_group_name?: string;
  ad_objective_name?: string;
  platform_position?: string;
  is_instagram?: boolean;
  is_an?: boolean;
  actual_timestamp_sec: number;
  is_click_through: boolean;
};

function isValidCachedMetaMir(obj: unknown): obj is MetaMirAttribution {
  if (!obj || typeof obj !== "object") {
    return false;
  }
  const m = obj as Record<string, unknown>;
  if (typeof m.raw !== "string" || typeof m.utm_source !== "string") {
    return false;
  }
  if (
    typeof m.actual_timestamp_sec !== "number" ||
    !Number.isFinite(m.actual_timestamp_sec)
  ) {
    return false;
  }
  const cid = typeof m.campaign_id === "string" ? m.campaign_id.trim() : "";
  const aid = typeof m.ad_id === "string" ? m.ad_id.trim() : "";
  const agid = typeof m.adgroup_id === "string" ? m.adgroup_id.trim() : "";
  if (!cid && !aid && !agid) {
    return false;
  }
  return (
    typeof m.utm_medium === "string" &&
    typeof m.utm_campaign === "string" &&
    typeof m.campaign_name === "string" &&
    typeof m.adgroup_id === "string"
  );
}

function isValidDecryptedMir(obj: Record<string, unknown>): boolean {
  const cid =
    typeof obj.campaign_id === "string" && obj.campaign_id.trim().length > 0;
  const aid = typeof obj.ad_id === "string" && obj.ad_id.trim().length > 0;
  const agid =
    typeof obj.adgroup_id === "string" && obj.adgroup_id.trim().length > 0;
  return cid || aid || agid;
}

function mapDecryptedToAttribution(
  decryptedJson: string,
  utmSourceHint: string,
  actualTimestampSec: number,
  isCt: number
): MetaMirAttribution | null {
  let obj: Record<string, unknown>;
  try {
    obj = JSON.parse(decryptedJson) as Record<string, unknown>;
  } catch {
    return null;
  }

  if (!isValidDecryptedMir(obj)) {
    return null;
  }

  const getString = (v: unknown): string => (typeof v === "string" ? v : "");
  const getBool = (v: unknown): boolean => !!v;

  const adgroupName = getString(obj.adgroup_name);
  const mapped: MetaMirAttribution = {
    raw: decryptedJson,

    campaign_id: getString(obj.campaign_id),
    campaign_name: getString(obj.campaign_name),
    ad_id: getString(obj.ad_id),
    adgroup_id: getString(obj.adgroup_id),
    account_id: getString(obj.account_id),
    publisher_platform: getString(obj.publisher_platform),

    adset_id: getString(obj.adset_id),
    adset_name: getString(obj.adset_name) || adgroupName,
    campaign_group_id: getString(obj.campaign_group_id),
    campaign_group_name: getString(obj.campaign_group_name),
    ad_objective_name: getString(obj.ad_objective_name),
    platform_position: getString(obj.platform_position),
    is_instagram: getBool(obj.is_instagram),
    is_an: getBool(obj.is_an),

    utm_source: "",
    utm_medium: "cpc",
    utm_campaign: "",
    actual_timestamp_sec: Math.floor(Number(actualTimestampSec) || 0),
    is_click_through: isCt === 1,
  };

  const utm_campaign = mapped.campaign_name || mapped.campaign_id;
  const isInstagram =
    mapped.is_instagram === true || mapped.publisher_platform === "instagram";
  let utm_source = utmSourceHint.trim();
  if (!utm_source) {
    utm_source = isInstagram ? "apps.instagram.com" : "apps.facebook.com";
  }

  mapped.utm_source = utm_source;
  mapped.utm_campaign = utm_campaign;
  return mapped;
}

async function invokeNativeMetaMirOnce(): Promise<Record<
  string,
  unknown
> | null> {
  mirLastNativeInvokeTimedOut = false;
  mirDiagTrace("[MIR] JS bridge invoked", { step: "invokeNativeMetaMirOnce" });
  const mod = NativeModules.MetaInstallReferrerModule as
    | {
        getMetaReferrer?: () => Promise<Record<string, unknown> | null>;
      }
    | undefined;
  if (!mod?.getMetaReferrer) {
    mirDiagTrace("[MIR] native call returned null", {
      reason: "native_module_getMetaReferrer_missing",
    });
    mirHardening.last_native_error_reason = "no_native_module";
    return null;
  }
  mirHardening.native_invoked = true;
  mirDiagTrace("[MIR] native call started", {
    timeout_ms: NATIVE_MIR_TIMEOUT_MS,
  });
  return new Promise((resolve) => {
    let settled = false;
    const t = setTimeout(() => {
      if (!settled) {
        settled = true;
        mirLastNativeInvokeTimedOut = true;
        mirDiagTrace("[MIR] timeout reached before resolve", {
          ms: NATIVE_MIR_TIMEOUT_MS,
        });
        mirDiagTrace("[MIR] native call returned null", {
          reason: "js_timeout",
        });
        resolve(null);
      }
    }, NATIVE_MIR_TIMEOUT_MS);
    mod.getMetaReferrer!()
      .then((res) => {
        if (!settled) {
          settled = true;
          clearTimeout(t);
          mirDiagTrace("[MIR] native call resolved", {
            typeof_res: typeof res,
            resolved_nullish: res == null,
          });
          resolve(res ?? null);
        }
      })
      .catch(() => {
        if (!settled) {
          settled = true;
          clearTimeout(t);
          mirDiagTrace("[MIR] native call returned null", {
            reason: "promise_rejected",
          });
          resolve(null);
        }
      });
  });
}

/**
 * Single native call + map. Does not read cache (use `resolveMetaMirAttribution` for one-shot policy).
 */
function logMirResult(
  status: "error" | "success" | "empty",
  errorReason: string | null,
  hasPayload: boolean,
  extra?: Record<string, unknown>
): void {
  mirResultLogInvocationCount += 1;
  const payload: Record<string, unknown> = {
    status,
    error_reason: errorReason,
    has_payload: hasPayload,
    ...extra,
  };
  // Keep a single structured MIR result log for production diagnostics.
  console.log("[MIR][RESULT]", payload);
}

function nativeNullDiagReason(raw: unknown): string {
  if (!raw || typeof raw !== "object") {
    return "native_response_null_or_non_object";
  }
  const r = raw as Record<string, unknown>;
  if (typeof r.error_reason === "string" && r.error_reason.trim().length > 0) {
    return "native_map_has_error_reason";
  }
  if (
    typeof r.decryptedCampaignJson !== "string" ||
    r.decryptedCampaignJson.length === 0
  ) {
    return "native_missing_decryptedCampaignJson";
  }
  return "native_map_unexpected_shape";
}

function classifyNativeResponse(raw: unknown): Record<string, unknown> {
  if (raw === null || raw === undefined) {
    return { kind: "nullish" };
  }
  if (typeof raw !== "object") {
    return { kind: "non_object", typeof: typeof raw };
  }
  const r = raw as Record<string, unknown>;
  return {
    kind: "object",
    has_error_reason: typeof r.error_reason === "string",
    has_decrypted_campaign:
      typeof r.decryptedCampaignJson === "string" &&
      String(r.decryptedCampaignJson).length > 0,
  };
}

export async function fetchMetaInstallReferrerFromNative(): Promise<MetaMirAttribution | null> {
  if (Platform.OS !== "android") {
    return null;
  }
  try {
    const raw = await invokeNativeMetaMirOnce();
    if (!raw || typeof raw !== "object") {
      mirDiagTrace("[MIR] native call returned null", {
        reason: nativeNullDiagReason(raw),
        classify: classifyNativeResponse(raw),
      });
      const err =
        mirHardening.last_native_error_reason ??
        (mirLastNativeInvokeTimedOut
          ? "native_timeout"
          : "native_response_null");
      mirHardening.last_native_error_reason = err;
      logMirResult("empty", err, false);
      return null;
    }
    const errReason =
      typeof raw.error_reason === "string" ? raw.error_reason.trim() : "";
    if (errReason) {
      mirHardening.last_native_error_reason = errReason;
      const isHardError =
        errReason === "decrypt_failed" ||
        errReason === "missing_key" ||
        errReason === "unexpected_error" ||
        errReason === "executor_failure" ||
        errReason === "promise_bridge_error";
      logMirResult(isHardError ? "error" : "empty", errReason, false);
      return null;
    }
    const decrypted = raw.decryptedCampaignJson;
    if (typeof decrypted !== "string" || !decrypted.length) {
      mirHardening.last_native_error_reason = "missing_decrypted_payload";
      logMirResult("empty", "missing_decrypted_payload", false);
      return null;
    }
    // Native no longer passes Play/outer utm — derive utm in map from publisher_platform
    const utmSourceHint = "";
    const actualTs = Number(raw.actualTimestampSec ?? 0);
    const isCt = Number(raw.isClickThrough ?? -1);
    const mapped = mapDecryptedToAttribution(
      decrypted,
      utmSourceHint,
      actualTs,
      isCt
    );
    if (mapped) {
      mirHardening.has_payload = true;
      mirHardening.last_native_error_reason = null;
      logMirResult("success", null, true);
    } else {
      mirHardening.last_native_error_reason = "map_attribution_null";
      logMirResult("empty", "map_attribution_null", false);
    }
    return mapped;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    mirHardening.last_native_error_reason = `js_error:${msg}`;
    logMirResult("error", mirHardening.last_native_error_reason, false);
    return null;
  }
}

async function clearMirKeysForInstall(installId: string): Promise<void> {
  const { fetchedKey, cacheKey, failAttemptsKey } =
    getMetaMirStorageKeys(installId);
  try {
    await AsyncStorage.multiRemove([fetchedKey, cacheKey, failAttemptsKey]);
  } catch {}
}

/**
 * Resolves MIR per `getOrCreateInstallInstanceId()`: returns cached success payload; otherwise calls
 * native up to MAX_MIR_NATIVE_FAIL_ATTEMPTS times when attribution is null (no permanent
 * empty cache). Successful attribution is cached with `meta_install_referrer_fetched_*`.
 */
export async function resolveMetaMirAttribution(): Promise<MetaMirAttribution | null> {
  const logMirResultCountEnter = mirResultLogInvocationCount;
  try {
    if (Platform.OS !== "android") {
      logMirResult("empty", "platform_not_android", false);
      return null;
    }

    const installId = await getOrCreateInstallInstanceId();

    if (isDebugMockMirEnabled()) {
      const mock = buildDebugMockMirAttribution();
      mirHardening.has_payload = true;
      mirHardening.from_cache = false;
      mirHardening.native_invoked = false;
      mirHardening.last_native_error_reason = null;
      logMirResult("success", null, true, { debug_mock: true });
      return mock;
    }

    const { fetchedKey, cacheKey, failAttemptsKey } =
      getMetaMirStorageKeys(installId);

    const cachedRaw = await AsyncStorage.getItem(cacheKey);
    if (cachedRaw === META_MIR_CACHE_EMPTY) {
      mirDiagTrace("[MIR] MIR cache sentinel empty — clearing keys", {
        install_id: installId,
      });
      await clearMirKeysForInstall(installId);
    } else if (cachedRaw) {
      try {
        const parsed: unknown = JSON.parse(cachedRaw);
        if (isValidCachedMetaMir(parsed)) {
          mirHardening.has_payload = true;
          mirHardening.from_cache = true;
          mirHardening.last_native_error_reason = null;
          logMirResult("success", null, true, {
            install_id: installId,
            from_cache: true,
          });
          return parsed;
        }
      } catch (e) {
        void e;
      }
      await clearMirKeysForInstall(installId);
    }

    const failAttempts = parseInt(
      (await AsyncStorage.getItem(failAttemptsKey)) ?? "0",
      10
    );
    if (
      Number.isFinite(failAttempts) &&
      failAttempts >= MAX_MIR_NATIVE_FAIL_ATTEMPTS
    ) {
      mirHardening.last_native_error_reason = "max_native_attempts";
      logMirResult("empty", "max_native_attempts", false);
      return null;
    }

    const mapped = await fetchMetaInstallReferrerFromNative();

    try {
      if (mapped) {
        await AsyncStorage.setItem(fetchedKey, "1");
        await AsyncStorage.setItem(cacheKey, JSON.stringify(mapped));
        await AsyncStorage.removeItem(failAttemptsKey);
      } else {
        await AsyncStorage.setItem(failAttemptsKey, String(failAttempts + 1));
      }
    } catch {}

    return mapped;
  } finally {
    if (
      Platform.OS === "android" &&
      mirResultLogInvocationCount === logMirResultCountEnter
    ) {
      logMirResult("empty", "resolve_exit_without_logged_mir_result", false, {
        instrumentation_gap_recovery: true,
      });
    }
  }
}
