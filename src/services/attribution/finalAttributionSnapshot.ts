import AsyncStorage from "@react-native-async-storage/async-storage";

import type { MetaDecisionReason } from "./attributionDecisionReason";

export type AttributionConfidence = "high" | "medium" | "low";

/** Which branch won — frozen for this install instance after first resolution. */
export type FrozenWinner = "applink" | "mir" | "gpi" | "deduped_gpi";

export type ApplinkFlatSnapshot = {
  raw: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
};

export type FinalAttributionSnapshotV1 = {
  v: 1;
  decision_reason: MetaDecisionReason;
  frozen_winner: FrozenWinner;
  campaign_id: string;
  timestamp_sec: number;
  confidence: AttributionConfidence;
  is_reengagement: boolean;
  /** Present when `frozen_winner === 'applink'` — replay if App Links API returns null. */
  applink_flat?: ApplinkFlatSnapshot;
};

export function finalAttributionSnapshotKey(installId: string): string {
  return `final_attribution_snapshot_${installId}`;
}

export async function loadFinalAttributionSnapshot(
  installId: string
): Promise<FinalAttributionSnapshotV1 | null> {
  try {
    const raw = await AsyncStorage.getItem(
      finalAttributionSnapshotKey(installId)
    );
    if (!raw) {
      return null;
    }
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === "object" &&
      (parsed as { v?: unknown }).v === 1
    ) {
      return parsed as FinalAttributionSnapshotV1;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Writes once per install instance — do not overwrite an existing v1 snapshot (callers check first).
 */
export async function saveFinalAttributionSnapshot(
  installId: string,
  snapshot: FinalAttributionSnapshotV1
): Promise<void> {
  await AsyncStorage.setItem(
    finalAttributionSnapshotKey(installId),
    JSON.stringify(snapshot)
  );
}
