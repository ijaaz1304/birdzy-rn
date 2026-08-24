/**
 * Persisted + analytics: why this install was attributed to a given source.
 * Use when reconciling Firebase vs Meta Ads Manager.
 */
export type MetaDecisionReason =
  | "applink"
  | "mir_newer"
  | "gpir_newer"
  | "gpir_dedup_match"
  | "mir_vt_only"
  | "gpir_only"
  | "mir_only"
  | "fallback_organic";
