/**
 * Birdzy subscription / IAP pack configuration.
 * Use this instead of fetching SUBSCRIPTION_VALUE URL.
 *
 * App Store Connect (canonical plan ids in birdzyPacks.json `name`):
 * - weekly_pack_birdzy (SUBS)
 * - yearly_birdzy_pack (SUBS)
 * - yearly_birdzy_pack_half_price (SUBS)
 * - lifetime_birdzy (IAP)
 * - lifetime_birdzy_half_price (IAP)
 *
 * Google Play override (`androidName` only where ID differs from iOS):
 * - yearly_birdzy_pack → yearly_pack_birdzy
 */

export interface PackItem {
  name: string;
  type: "IAP" | "SUBS";
  title: string;
}

export interface SubscriptionPacksConfig {
  full_pack: PackItem[];
  half_pack: PackItem[];
}

import birdzyPacksJson from "./birdzyPacks.json";

export const subscriptionPacks: SubscriptionPacksConfig =
  birdzyPacksJson as SubscriptionPacksConfig;
