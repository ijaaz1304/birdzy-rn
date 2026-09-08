import type { LimitType } from "../../../config/subscription.config";

export type UpgradeModalPreviewItem = {
  limitType: LimitType;
  label: string;
};

/** All limit-reached / upgrade bottom sheets for Settings dev preview. */
export const UPGRADE_MODAL_PREVIEW_ITEMS: UpgradeModalPreviewItem[] = [
  { limitType: "identification", label: "Photo identification" },
  { limitType: "soundIdentification", label: "Sound identification" },
  { limitType: "collection", label: "Collection" },
  { limitType: "collectionAlt", label: "Collection (alt layout)" },
  { limitType: "details", label: "Bird details" },
  { limitType: "feed", label: "Feed post" },
  { limitType: "birdOfDay", label: "Bird of the day" },
  { limitType: "aiChat", label: "Ask AI chat" },
  { limitType: "soundGallery", label: "Sound gallery" },
];
