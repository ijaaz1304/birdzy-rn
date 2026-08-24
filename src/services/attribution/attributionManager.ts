/**
 * Install attribution orchestration (Android / Play Store only).
 *
 * Limitations:
 * - Only works when the app was installed from Google Play with a valid referrer.
 * - Not guaranteed across reinstall or app data clear (AsyncStorage flags reset).
 * - Sideloaded / adb installs do not receive Play install referrer.
 * - Firebase Analytics only; no server-side deduplication.
 *
 * NOTE:
 * In rare cases (e.g. app crash after logging but before persistence),
 * analytics events may be sent more than once. This is expected behavior
 * without backend deduplication.
 *
 * Timestamps from native are in milliseconds (see InstallReferrerModule.java); do not multiply again.
 *
 * Deferred App Link (Meta) is read for context and fallback when MIR/GPIR do not produce a winner.
 * MIR and GPIR are resolved in parallel (soft timeout). MIR always takes precedence over GPIR when
 * both are available (Coinzy-aligned). Analytics: `meta_source` = applink | mir | gpir; deduped
 * CT adds `meta_dedup` + MIR touch metadata when a frozen snapshot used deduped_gpi.
 */

import { NativeModules, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  fetchInstallReferrerFromNative,
  INSTALL_REFERRER_STORAGE_KEY,
  persistInstallReferrerData,
  type InstallReferrerPayload,
} from "./androidReferrer";

/** True when dev sets `globalThis.ATTRIBUTION_DEBUG_REFERRER` (string). Used to skip failure fallback. */
function isAttributionDebugReferrerActive(): boolean {
  if (!__DEV__ || Platform.OS !== "android") {
    return false;
  }
  const v = (globalThis as { ATTRIBUTION_DEBUG_REFERRER?: string })
    .ATTRIBUTION_DEBUG_REFERRER;
  return typeof v === "string";
}
import { parseReferrer, type ParsedReferrer } from "./referrerParser";
import { logInstallAttribution } from "../analytics/attributionAnalytics";
import { analyticsService } from "../analytics/analytics.service";
import { waitForFirebaseReady } from "../../lib/firebase/config";
import { getMetaAttribution } from "./metaAttribution";
import {
  getMirAttributionHardeningSnapshot,
  mirDiagTrace,
  resetMirAttributionHardeningState,
  resolveMetaMirAttribution,
  type MetaMirAttribution,
} from "./metaInstallReferrer";
import type { MetaDecisionReason } from "./attributionDecisionReason";
import {
  loadFinalAttributionSnapshot,
  saveFinalAttributionSnapshot,
  type AttributionConfidence,
  type FinalAttributionSnapshotV1,
  type FrozenWinner,
} from "./finalAttributionSnapshot";
import {
  getOrCreateInstallInstanceId,
  getTimeSinceFirstOpenMs,
} from "./installInstance";
import analytics from "@react-native-firebase/analytics";

/** Firebase Analytics param length safety (string params). */
const MAX_PARAM_LENGTH = 100;
const MAX_RAW_META_PAYLOAD_LENGTH = 500;

const ATTRIBUTION_SENT_KEY = "attribution_sent";

export const MAX_ATTEMPTS = 3;
export const DELAYS_MS = [1000, 2000] as const;
export const TOTAL_TIMEOUT_MS = 10000;

/** Soft cap on blocking for parallel MIR + GPIR — proceed with partials, then up to `POST_SOFT_GRACE_MS` catch-up. */
const SOFT_PARALLEL_MS = 4000;
const POST_SOFT_GRACE_MS = 1000;

let attributionInitInProgress = false;

/** Ensures `initAttribution` schedules work at most once per process / cold start. */
let attributionScheduledThisLaunch = false;

/** Every attribution-related Firebase `logEvent` payload should carry these (defaults when unknown). */
const ATTRIBUTION_FB_META_DEFAULT: Record<string, string | number> = {
  meta_source: "",
  meta_touch: "",
  meta_mir_ts: 0,
  attribution_confidence: "unknown",
};

function withAttributionFirebase(
  p: Record<string, unknown>
): Record<string, string | number | boolean> {
  const mts = p.meta_mir_ts;
  const meta_mir_ts =
    typeof mts === "number" && !Number.isNaN(mts)
      ? mts
      : typeof mts === "string"
      ? parseFloat(mts) || 0
      : 0;
  return {
    ...ATTRIBUTION_FB_META_DEFAULT,
    ...p,
    meta_source:
      p.meta_source != null
        ? String(p.meta_source)
        : String(ATTRIBUTION_FB_META_DEFAULT.meta_source),
    meta_touch:
      p.meta_touch != null
        ? String(p.meta_touch)
        : String(ATTRIBUTION_FB_META_DEFAULT.meta_touch),
    meta_mir_ts,
    attribution_confidence:
      p.attribution_confidence != null
        ? String(p.attribution_confidence)
        : String(ATTRIBUTION_FB_META_DEFAULT.attribution_confidence),
  } as Record<string, string | number | boolean>;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Rejects when `deadline` is exceeded. Drains late-settling promises to avoid unhandled rejections.
 */
export function withTimeout<T>(
  promise: Promise<T>,
  deadline: number
): Promise<T> {
  const remaining = deadline - Date.now();
  if (remaining <= 0) {
    promise.then(() => undefined).catch(() => undefined);
    return Promise.reject(new Error("Timeout"));
  }
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      promise.then(() => undefined).catch(() => undefined);
      reject(new Error("Timeout"));
    }, remaining);
    promise
      .then((res) => {
        clearTimeout(t);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(t);
        reject(err);
      });
  });
}

function orEmpty(s: string | undefined): string {
  return s ?? "";
}

/**
 * Organic when: empty referrer, Play "(not set)", or no utm_source / utm_medium / utm_campaign.
 * Aligns with Play-style organic: source google-play, medium organic, empty campaign.
 */
function isOrganicInstall(rawRef: string, parsed: ParsedReferrer): boolean {
  const trimmed = rawRef.trim();
  if (!trimmed) {
    return true;
  }
  const decoded = decodeURIComponent(trimmed);
  const lowerTrimmed = trimmed.toLowerCase();
  const lowerDecoded = decoded.toLowerCase();
  if (
    lowerTrimmed.includes("(not set)") ||
    lowerTrimmed.includes("(not%20set)") ||
    lowerDecoded.includes("(not set)")
  ) {
    return true;
  }
  if (
    (parsed.source ?? "").trim().toLowerCase() === "(not set)" &&
    (parsed.medium ?? "").trim().toLowerCase() === "(not set)"
  ) {
    return true;
  }
  const hasAnyUtm = !!(parsed.source || parsed.medium || parsed.campaign);
  return !hasAnyUtm;
}

function buildAnalyticsPayload(payload: InstallReferrerPayload): {
  campaign: string;
  source: string;
  medium: string;
  platform: string;
  raw_referrer: string;
} {
  const raw = payload.installReferrer;
  const rawRef = typeof raw === "string" ? raw.trim() : "";
  const parsed = parseReferrer(rawRef);
  const organic = isOrganicInstall(rawRef, parsed);

  if (organic) {
    return {
      campaign: "",
      source: "google-play",
      medium: "organic",
      platform: "android",
      raw_referrer: rawRef.slice(0, 100),
    };
  }

  return {
    campaign: orEmpty(parsed.campaign),
    source: orEmpty(parsed.source),
    medium: orEmpty(parsed.medium),
    platform: "android",
    raw_referrer: rawRef.slice(0, 100),
  };
}

function attributionConfidenceParam(
  c: AttributionConfidence
): Record<string, string> {
  return { attribution_confidence: c };
}

function telemetryBase(
  reason: MetaDecisionReason
): Record<string, string | boolean> {
  return {
    meta_decision_reason: reason,
    is_reengagement: false,
  };
}

function metaSourceParam(
  source: "applink" | "mir" | "gpir"
): Record<string, string> {
  return { meta_source: source };
}

type MirGpiChoice =
  | { kind: "mir"; mir: MetaMirAttribution }
  | { kind: "gpi"; payload: InstallReferrerPayload }
  | {
      kind: "deduped_gpi";
      payload: InstallReferrerPayload;
      mir: MetaMirAttribution;
    }
  | null;

function pickMirVsGpiWithReason(
  mir: MetaMirAttribution | null,
  gpi: InstallReferrerPayload | null
):
  | { choice: MirGpiChoice; reason: MetaDecisionReason | null }
  | { choice: null; reason: null } {
  if (!mir && !gpi) {
    return { choice: null, reason: null };
  }
  if (mir && gpi) {
    return { choice: { kind: "mir", mir }, reason: "mir_only" };
  }
  if (mir && !gpi) {
    return { choice: { kind: "mir", mir }, reason: "mir_only" };
  }
  if (!mir && gpi) {
    return { choice: { kind: "gpi", payload: gpi }, reason: "gpir_only" };
  }
  return { choice: null, reason: null };
}

function resolveChoiceWithSnapshot(
  snap: FinalAttributionSnapshotV1 | null,
  mir: MetaMirAttribution | null,
  gpi: InstallReferrerPayload | null
):
  | { choice: MirGpiChoice; reason: MetaDecisionReason | null }
  | { choice: null; reason: null } {
  if (snap?.v === 1 && snap.frozen_winner !== "applink") {
    switch (snap.frozen_winner) {
      case "mir":
        if (mir) {
          return { choice: { kind: "mir", mir }, reason: snap.decision_reason };
        }
        break;
      case "gpi":
        if (gpi) {
          return {
            choice: { kind: "gpi", payload: gpi },
            reason: snap.decision_reason,
          };
        }
        break;
      case "deduped_gpi":
        if (mir && gpi) {
          return {
            choice: { kind: "deduped_gpi", payload: gpi, mir },
            reason: snap.decision_reason,
          };
        }
        break;
      default:
        break;
    }
  }
  return pickMirVsGpiWithReason(mir, gpi);
}

function frozenWinnerFromChoice(
  choice: NonNullable<MirGpiChoice>
): FrozenWinner {
  if (choice.kind === "mir") {
    return "mir";
  }
  if (choice.kind === "gpi") {
    return "gpi";
  }
  return "deduped_gpi";
}

function campaignIdFromMirGpiChoice(choice: NonNullable<MirGpiChoice>): string {
  if (choice.kind === "mir" || choice.kind === "deduped_gpi") {
    const mir = choice.mir;
    return (mir.campaign_id || mir.ad_id || "").trim();
  }
  const parsed = parseReferrer(String(choice.payload.installReferrer ?? ""));
  return (parsed.campaign || "").trim();
}

function confidenceFromMirGpiChoice(
  choice: NonNullable<MirGpiChoice>
): AttributionConfidence {
  if (choice.kind === "deduped_gpi") {
    return "high";
  }
  if (choice.kind === "gpi") {
    const raw = String(choice.payload.installReferrer ?? "");
    const parsed = parseReferrer(raw);
    return isOrganicInstall(raw, parsed) ? "low" : "high";
  }
  return choice.mir.is_click_through ? "medium" : "low";
}

function buildMirGpiSnapshot(
  choice: NonNullable<MirGpiChoice>,
  reason: MetaDecisionReason
): FinalAttributionSnapshotV1 {
  return {
    v: 1,
    decision_reason: reason,
    frozen_winner: frozenWinnerFromChoice(choice),
    campaign_id: campaignIdFromMirGpiChoice(choice),
    timestamp_sec: Math.floor(Date.now() / 1000),
    confidence: confidenceFromMirGpiChoice(choice),
    is_reengagement: false,
  };
}

async function fetchMirGpiParallelWithSoftTimeout(
  deadline: number,
  preResolvedMir?: MetaMirAttribution | null
): Promise<{
  mir: MetaMirAttribution | null;
  gpi: InstallReferrerPayload | null;
}> {
  const mirSkippedSecondResolve = !!preResolvedMir;
  if (mirSkippedSecondResolve) {
    mirDiagTrace("[MIR] skipped due to reason", {
      reason: "preResolvedMir_already_set_parallel_uses_first_pass_only",
    });
  }
  const mirP = Promise.resolve(preResolvedMir ?? null).then((v) =>
    v ? v : resolveMetaMirAttribution()
  );
  const gpiP = ensurePlayInstallReferrerPayload(deadline);
  let mirDone: MetaMirAttribution | null | undefined;
  let gpiDone: InstallReferrerPayload | null | undefined;
  const markM = mirP
    .then((v) => {
      mirDone = v;
    })
    .catch(() => {
      mirDone = null;
    });
  const markG = gpiP
    .then((v) => {
      gpiDone = v;
    })
    .catch(() => {
      gpiDone = null;
    });
  const soft = Math.min(SOFT_PARALLEL_MS, Math.max(0, deadline - Date.now()));
  mirDiagTrace("[MIR] waiting with timeout", {
    soft_parallel_ms: soft,
    post_soft_grace_ms: POST_SOFT_GRACE_MS,
    deadline_remaining_ms: deadline - Date.now(),
  });
  await Promise.race([Promise.all([markM, markG]), sleep(soft)]);
  const mirPendingAfterSoft = mirDone === undefined;
  if (mirPendingAfterSoft) {
    mirDiagTrace("[MIR] timeout reached before resolve", {
      phase: "soft_window",
      soft_ms: soft,
    });
  }
  const mir =
    mirDone !== undefined
      ? mirDone
      : await Promise.race([
          mirP,
          sleep(POST_SOFT_GRACE_MS).then(() => null),
        ]).catch(() => null);
  const gpi =
    gpiDone !== undefined
      ? gpiDone
      : await Promise.race([
          gpiP,
          sleep(POST_SOFT_GRACE_MS).then(() => null),
        ]).catch(() => null);
  if (mirDone === undefined && mir == null && mirPendingAfterSoft) {
    mirDiagTrace("[MIR] timeout reached before resolve", {
      phase: "post_soft_grace",
      grace_ms: POST_SOFT_GRACE_MS,
    });
  }
  return { mir: mir ?? null, gpi: gpi ?? null };
}

function sanitizeMetaReferrerReceivedParams(
  mir: MetaMirAttribution
): Record<string, string | number> {
  const asSafeString = (v: unknown): string => (typeof v === "string" ? v : "");
  return {
    campaign_id: asSafeString(mir.campaign_id),
    ad_id: asSafeString(mir.ad_id),
    adgroup_id: asSafeString(mir.adgroup_id),
    account_id: asSafeString(mir.account_id),
    publisher_platform: asSafeString(mir.publisher_platform),
    adset_id: asSafeString(mir.adset_id),
    campaign_name: asSafeString(mir.campaign_name),
    raw_meta_payload: asSafeString(mir.raw).slice(
      0,
      MAX_RAW_META_PAYLOAD_LENGTH
    ),
  };
}

function metaMirAttributionExtras(
  mir: MetaMirAttribution,
  source: "mir" | "gpir",
  confidence: AttributionConfidence
): Record<string, string | number> {
  return {
    meta_source: source,
    meta_touch: mir.is_click_through ? "ct" : "vt",
    meta_mir_ts: mir.actual_timestamp_sec,
    attribution_confidence: confidence,
  };
}

function mirDedupExtras(
  mir: MetaMirAttribution | undefined
): Record<string, string | number> {
  if (!mir) {
    return {};
  }
  return {
    meta_dedup: 1,
    ...metaMirAttributionExtras(mir, "gpir", "high"),
  };
}

async function ensurePlayInstallReferrerPayload(
  deadline: number
): Promise<InstallReferrerPayload | null> {
  let payload: InstallReferrerPayload | null = null;

  try {
    const cachedStr = await AsyncStorage.getItem(INSTALL_REFERRER_STORAGE_KEY);
    if (cachedStr) {
      try {
        const parsed = JSON.parse(cachedStr) as Partial<InstallReferrerPayload>;
        if (
          parsed &&
          typeof parsed.installReferrer === "string" &&
          typeof parsed.clickTimestamp === "number" &&
          typeof parsed.installTimestamp === "number"
        ) {
          payload = {
            installReferrer: parsed.installReferrer,
            clickTimestamp: parsed.clickTimestamp,
            installTimestamp: parsed.installTimestamp,
            platform: "android",
          };
        }
      } catch {
        /* invalid cache */
      }
    }
  } catch {
    /* continue */
  }

  if (payload) {
    return payload;
  }

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (Date.now() > deadline) {
      break;
    }

    try {
      const result = await withTimeout(
        fetchInstallReferrerFromNative(),
        deadline
      );
      if (result) {
        return result;
      }
    } catch (e) {
      void e;
    }

    if (attempt < DELAYS_MS.length) {
      const remaining = deadline - Date.now();
      if (remaining <= 0) {
        break;
      }
      const delay = Math.min(DELAYS_MS[attempt], remaining);
      await sleep(delay);
    }
  }

  return null;
}

function buildInstallReferrerReceivedParams(
  payload: InstallReferrerPayload,
  parsed: ParsedReferrer,
  organic: boolean
): Record<string, string | number> {
  const rawFull = String(payload.installReferrer ?? "");
  const rawTrunc =
    rawFull.length > MAX_PARAM_LENGTH
      ? rawFull.slice(0, MAX_PARAM_LENGTH)
      : rawFull;
  const clickTs = Math.floor(Number(payload.clickTimestamp) / 1000);
  const installTs = Math.floor(Number(payload.installTimestamp) / 1000);

  if (organic) {
    return {
      raw_referrer: rawTrunc,
      utm_source: "google-play",
      utm_medium: "organic",
      utm_campaign: "",
      click_ts: clickTs,
      install_ts: installTs,
    };
  }

  return {
    raw_referrer: rawTrunc,
    utm_source: orEmpty(parsed.source),
    utm_medium: orEmpty(parsed.medium),
    utm_campaign: orEmpty(parsed.campaign),
    click_ts: clickTs,
    install_ts: installTs,
  };
}

function logInstallReferrerErrorEvent(
  reason: string,
  responseCode: string = "unknown"
): void {
  try {
    analyticsService.logEvent(
      "install_referrer_error",
      withAttributionFirebase({
        reason: reason || "unknown",
        response_code: responseCode || "unknown",
      })
    );
  } catch {
    /* non-fatal */
  }
}

async function ensureFirebaseReadyOrThrow(maxWaitMs: number): Promise<void> {
  const ready = await waitForFirebaseReady(maxWaitMs);
  if (!ready) {
    throw new Error("firebase_not_ready_for_attribution_event");
  }
}

/**
 * Fire-and-forget: single attribution pass per install (best-effort), non-blocking.
 */
export function initAttribution(): void {
  mirDiagTrace("[Attribution] initAttribution invoked", {
    platform: Platform.OS,
  });
  if (Platform.OS !== "android") {
    mirDiagTrace("[Attribution] initAttribution skipped (reason)", {
      reason: "platform_not_android",
    });
    return;
  }
  if (attributionScheduledThisLaunch) {
    mirDiagTrace("[Attribution] initAttribution skipped (reason)", {
      reason: "already_scheduled_this_launch",
      attributionScheduledThisLaunch,
    });
    return;
  }
  attributionScheduledThisLaunch = true;

  initAttributionAsync().catch(() => {
    /* errors logged inside */
  });
}

async function initAttributionAsync(): Promise<void> {
  if (Platform.OS !== "android") {
    mirDiagTrace("[Attribution] initAttributionAsync early exit", {
      reason: "platform_not_android",
    });
    return;
  }

  if (attributionInitInProgress) {
    mirDiagTrace("[Attribution] initAttribution skipped (reason)", {
      reason: "attribution_init_in_progress_true",
    });
    return;
  }

  attributionInitInProgress = true;

  const tFinal = {
    run: false,
    app_link: "absent" as "present" | "absent",
    mir_attempted: false,
    mir_has_payload: false,
    mir_error_reason: null as string | null,
    gpir_present: false,
    final_source: "none" as "mir" | "gpir" | "applink" | "organic" | "none",
    decision_reason: "",
    campaign_id: "",
    ad_id: "",
  };

  try {
    const sent = await AsyncStorage.getItem(ATTRIBUTION_SENT_KEY);
    if (sent === "true") {
      mirDiagTrace("[Attribution] initAttribution skipped (reason)", {
        reason: "attribution_sent_flag_true",
        storage_key: ATTRIBUTION_SENT_KEY,
      });
      return;
    }

    tFinal.run = true;
    resetMirAttributionHardeningState();

    const mirMod = NativeModules.MetaInstallReferrerModule as
      | { isDecryptionKeyConfigured?: () => Promise<boolean> }
      | undefined;
    if (mirMod?.isDecryptionKeyConfigured) {
      try {
        const keyOk = await mirMod.isDecryptionKeyConfigured();
        if (!keyOk) {
          console.error("[MIR] Missing decryption key");
        }
      } catch {
        /* non-fatal */
      }
    }

    const deadline = Date.now() + TOTAL_TIMEOUT_MS;
    let payload: InstallReferrerPayload | null = null;
    let mirDedupContext: MetaMirAttribution | undefined;
    let decisionReason: MetaDecisionReason | null = null;

    const installId = await getOrCreateInstallInstanceId();
    const frozenSnap = await loadFinalAttributionSnapshot(installId);

    let meta = await getMetaAttribution();
    if (
      !meta &&
      frozenSnap?.v === 1 &&
      frozenSnap.frozen_winner === "applink" &&
      frozenSnap.applink_flat
    ) {
      const a = frozenSnap.applink_flat;
      meta = {
        raw: a.raw,
        utm_source: a.utm_source,
        utm_medium: a.utm_medium,
        utm_campaign: a.utm_campaign,
      };
    }

    if (meta) {
      // Keep App Link observability but do not short-circuit.
      // MIR (with richer payload) and GPIR can still be resolved and selected.
      const metaWaitMs = Math.max(300, deadline - Date.now());
      await ensureFirebaseReadyOrThrow(metaWaitMs);

      const applinkTel = {
        ...telemetryBase("applink"),
        ...metaSourceParam("applink"),
        ...attributionConfidenceParam("high"),
      };
      await analytics().logEvent(
        "install_referrer_received",
        withAttributionFirebase({
          raw_referrer: meta.raw.slice(0, 100),
          utm_source: meta.utm_source,
          utm_medium: meta.utm_medium,
          utm_campaign: meta.utm_campaign,
          click_ts: 0,
          install_ts: 0,
          meta_mir_ts: 0,
          meta_touch: "n/a",
          ...applinkTel,
        })
      );
    }

    tFinal.mir_attempted = true;

    mirDiagTrace("[MIR] resolveMetaMirAttribution START", {
      source: "attributionManager",
    });
    let preResolvedMir: MetaMirAttribution | null = null;
    try {
      preResolvedMir = await resolveMetaMirAttribution();
    } finally {
      mirDiagTrace("[MIR] resolveMetaMirAttribution END", {
        source: "attributionManager",
        has_mir: !!preResolvedMir,
      });
    }
    if (preResolvedMir) {
      const safeMetaReferrerPayload =
        sanitizeMetaReferrerReceivedParams(preResolvedMir);
      analyticsService.logEvent(
        "meta_referrer_received",
        withAttributionFirebase({
          ...safeMetaReferrerPayload,
          ...metaMirAttributionExtras(
            preResolvedMir,
            "mir",
            preResolvedMir.is_click_through ? "medium" : "low"
          ),
        })
      );
    }

    const { mir: metaMir, gpi: playPayload } =
      await fetchMirGpiParallelWithSoftTimeout(deadline, preResolvedMir);

    tFinal.mir_has_payload = !!metaMir;
    tFinal.gpir_present = !!playPayload;
    tFinal.mir_error_reason =
      getMirAttributionHardeningSnapshot().last_native_error_reason;
    tFinal.app_link = meta ? "present" : "absent";

    const resolved = resolveChoiceWithSnapshot(
      frozenSnap,
      metaMir,
      playPayload
    );
    const choice = resolved.choice;
    decisionReason = resolved.reason;
    tFinal.decision_reason = (decisionReason ?? "") as string;

    if (
      choice &&
      decisionReason &&
      !frozenSnap &&
      (choice.kind === "mir" ||
        choice.kind === "gpi" ||
        choice.kind === "deduped_gpi")
    ) {
      await saveFinalAttributionSnapshot(
        installId,
        buildMirGpiSnapshot(choice, decisionReason)
      );
    }

    if (choice?.kind === "mir") {
      const metaWaitMs = Math.max(300, deadline - Date.now());
      await ensureFirebaseReadyOrThrow(metaWaitMs);

      const mir = choice.mir;
      const dr = (decisionReason ?? "mir_only") as MetaDecisionReason;
      const extras = {
        ...metaMirAttributionExtras(
          mir,
          "mir",
          mir.is_click_through ? "medium" : "low"
        ),
        ...telemetryBase(dr),
      };
      const asSafeString = (v: unknown): string =>
        typeof v === "string" ? v : "";
      const asBoolInt = (v: unknown): 0 | 1 => (v ? 1 : 0);
      tFinal.final_source = "mir";
      tFinal.campaign_id = asSafeString(mir.campaign_id);
      tFinal.ad_id = asSafeString(mir.ad_id);
      tFinal.decision_reason = dr;
      await analytics().logEvent(
        "install_referrer_received",
        withAttributionFirebase({
          raw_referrer: mir.raw.slice(0, 100),
          utm_source: mir.utm_source,
          utm_medium: mir.utm_medium,
          utm_campaign: mir.utm_campaign,
          campaign_id: asSafeString(mir.campaign_id),
          campaign_name: asSafeString(mir.campaign_name),
          adgroup_id: asSafeString(mir.adgroup_id),
          ad_id: asSafeString(mir.ad_id),
          account_id: asSafeString(mir.account_id),
          publisher_platform: asSafeString(mir.publisher_platform),
          adset_id: asSafeString(mir.adset_id),
          adset_name: asSafeString(mir.adset_name),
          campaign_group_id: asSafeString(mir.campaign_group_id),
          campaign_group_name: asSafeString(mir.campaign_group_name),
          ad_objective_name: asSafeString(mir.ad_objective_name),
          platform_position: asSafeString(mir.platform_position),
          is_instagram: asBoolInt(mir.is_instagram),
          is_an: asBoolInt(mir.is_an),
          click_ts: Math.floor(Number(mir.actual_timestamp_sec) || 0),
          install_ts: 0,
          raw_meta_payload: mir.raw.slice(0, MAX_RAW_META_PAYLOAD_LENGTH),
          attribution_source: "meta_provider",
          ...extras,
        })
      );

      await analytics().logEvent(
        "install_campaign_attributed",
        withAttributionFirebase({
          utm_source: mir.utm_source,
          utm_medium: mir.utm_medium,
          utm_campaign: mir.utm_campaign,
          ...extras,
        })
      );
      await AsyncStorage.setItem(ATTRIBUTION_SENT_KEY, "true");
      return;
    }

    if (!choice && meta) {
      const applinkTel = {
        ...telemetryBase("applink"),
        ...metaSourceParam("applink"),
        ...attributionConfidenceParam("high"),
        meta_mir_ts: 0,
        meta_touch: "n/a",
      };
      tFinal.final_source = "applink";
      tFinal.campaign_id = meta.utm_campaign;
      tFinal.ad_id = "";
      tFinal.decision_reason = "applink";
      await analytics().logEvent(
        "install_campaign_attributed",
        withAttributionFirebase({
          utm_source: meta.utm_source,
          utm_medium: meta.utm_medium,
          utm_campaign: meta.utm_campaign,
          ...applinkTel,
        })
      );
      if (!frozenSnap) {
        await saveFinalAttributionSnapshot(installId, {
          v: 1,
          decision_reason: "applink",
          frozen_winner: "applink",
          campaign_id: meta.utm_campaign || "",
          timestamp_sec: Math.floor(Date.now() / 1000),
          confidence: "high",
          is_reengagement: false,
          applink_flat: {
            raw: meta.raw,
            utm_source: meta.utm_source,
            utm_medium: meta.utm_medium,
            utm_campaign: meta.utm_campaign,
          },
        });
      }
      await AsyncStorage.setItem(ATTRIBUTION_SENT_KEY, "true");
      return;
    }

    if (choice?.kind === "gpi" || choice?.kind === "deduped_gpi") {
      payload = choice.payload;
      if (choice.kind === "deduped_gpi") {
        mirDedupContext = choice.mir;
      }
    }

    let lastFailureReason = "mir_and_play_referrer_unavailable";
    let lastResponseCode = "unknown";

    if (!payload) {
      try {
        analyticsService.logEvent("install_referrer_error", {
          reason: lastFailureReason || "no_referrer_payload",
          response_code: lastResponseCode || "unknown",
        });
      } catch {
        /* non-fatal */
      }

      if (isAttributionDebugReferrerActive()) {
        tFinal.final_source = "none";
        tFinal.decision_reason = "mir_and_play_referrer_unavailable";
        return;
      }

      const fallbackWaitMs = Math.max(300, deadline - Date.now());
      try {
        await ensureFirebaseReadyOrThrow(fallbackWaitMs);
        await logInstallAttribution(
          {
            source: "unknown",
            medium: "unknown",
            campaign: "unknown",
            platform: "android",
            raw_referrer: "",
          },
          Math.max(100, deadline - Date.now()),
          withAttributionFirebase({
            ...telemetryBase("fallback_organic"),
            ...metaSourceParam("gpir"),
            ...attributionConfidenceParam("low"),
            meta_mir_ts: 0,
            meta_touch: "n/a",
          }) as unknown as Record<string, string | number | boolean>
        );
        tFinal.final_source = "organic";
        tFinal.campaign_id = "";
        tFinal.ad_id = "";
        tFinal.decision_reason = "fallback_organic";
        await AsyncStorage.setItem(ATTRIBUTION_SENT_KEY, "true");
      } catch (e) {
        console.error(
          "[Attribution] Fallback install_attribution failed",
          e instanceof Error ? e.message : String(e)
        );
      }
      return;
    }

    if (payload) {
      try {
        await persistInstallReferrerData(payload);
      } catch {}
    }

    let parsed: ParsedReferrer;
    try {
      parsed = parseReferrer(String(payload.installReferrer ?? ""));
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      logInstallReferrerErrorEvent(`parse_referrer:${message}`, "unknown");
      parsed = {};
    }

    const rawForOrganic = String(payload.installReferrer ?? "");
    const organic = isOrganicInstall(rawForOrganic, parsed);

    const waitMs = Math.max(300, deadline - Date.now());

    try {
      await ensureFirebaseReadyOrThrow(waitMs);

      const gpirDr = (decisionReason ?? "gpir_only") as MetaDecisionReason;
      tFinal.final_source = organic ? "organic" : "gpir";
      tFinal.campaign_id = organic ? "" : orEmpty(parsed.campaign);
      tFinal.ad_id = "";
      tFinal.decision_reason = gpirDr;
      analyticsService.logEvent(
        "install_referrer_received",
        withAttributionFirebase({
          ...buildInstallReferrerReceivedParams(payload, parsed, organic),
          ...mirDedupExtras(mirDedupContext),
          ...(mirDedupContext
            ? {}
            : {
                ...metaSourceParam("gpir"),
                ...attributionConfidenceParam(organic ? "low" : "high"),
              }),
          ...telemetryBase(gpirDr),
        })
      );

      if (!organic) {
        const campaignParams: Record<string, string> = {
          utm_source: orEmpty(parsed.source),
          utm_medium: orEmpty(parsed.medium),
          utm_campaign: orEmpty(parsed.campaign),
        };
        if (parsed.term) {
          campaignParams.utm_term = parsed.term;
        }
        if (parsed.content) {
          campaignParams.utm_content = parsed.content;
        }
        analyticsService.logEvent(
          "install_campaign_attributed",
          withAttributionFirebase({
            ...campaignParams,
            ...mirDedupExtras(mirDedupContext),
            ...(mirDedupContext
              ? {}
              : {
                  ...metaSourceParam("gpir"),
                  ...attributionConfidenceParam("high"),
                }),
            ...telemetryBase(gpirDr),
          })
        );
      }

      const analyticsPayload = buildAnalyticsPayload(payload);
      const remainingWait = Math.max(100, deadline - Date.now());
      await logInstallAttribution(
        analyticsPayload,
        remainingWait,
        withAttributionFirebase({
          ...telemetryBase(gpirDr),
          ...metaSourceParam("gpir"),
          ...attributionConfidenceParam(organic ? "low" : "high"),
          meta_mir_ts: mirDedupContext?.actual_timestamp_sec ?? 0,
          meta_touch: mirDedupContext
            ? mirDedupContext.is_click_through
              ? "ct"
              : "vt"
            : "n/a",
        }) as unknown as Record<string, string | number | boolean>
      );
      await AsyncStorage.setItem(ATTRIBUTION_SENT_KEY, "true");
    } catch (e) {
      console.error(
        "[Attribution] GPIR Firebase path failed",
        e instanceof Error ? e.message : String(e)
      );
    }
  } finally {
    if (tFinal.run) {
      const snap = getMirAttributionHardeningSnapshot();
      getTimeSinceFirstOpenMs().then((timeSince) => {
        console.log("[Attribution][FINAL]", {
          app_link: tFinal.app_link,
          mir_attempted: tFinal.mir_attempted,
          mir_has_payload: tFinal.mir_has_payload,
          mir_error_reason: tFinal.mir_error_reason,
          mir_native_invoked: snap.native_invoked,
          mir_from_cache: snap.from_cache,
          gpir_present: tFinal.gpir_present,
          final_source: tFinal.final_source,
          decision_reason: tFinal.decision_reason,
          campaign_id: tFinal.campaign_id,
          ad_id: tFinal.ad_id,
          time_since_install_ms: timeSince,
        });
      });
    }
    attributionInitInProgress = false;
  }
}
