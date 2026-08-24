/**
 * Mushroom image URL lists from storage (mindat_images).
 * Used as fallback when API does not return imageUrls, and for quiz/rock personality defaults.
 * Keys match canonical names (e.g. basalt, tigers_eye).
 */

import { getFirebaseStorageUrl } from "../lib/firebase/storage";

export const MUSHROOM_IMAGE_URLS: Record<string, string[]> = {
  basalt: [
    "https://storage.googleapis.com/minerals-app-480613.firebasestorage.app/scraped/mindat_images/basalt/Basalt0.png",
    "https://storage.googleapis.com/minerals-app-480613.firebasestorage.app/scraped/mindat_images/basalt/Basalt1.png",
    "https://storage.googleapis.com/minerals-app-480613.firebasestorage.app/scraped/mindat_images/basalt/Basalt13.png",
    "https://storage.googleapis.com/minerals-app-480613.firebasestorage.app/scraped/mindat_images/basalt/Basalt2.png",
    "https://storage.googleapis.com/minerals-app-480613.firebasestorage.app/scraped/mindat_images/basalt/Basalt24.png",
    "https://storage.googleapis.com/minerals-app-480613.firebasestorage.app/scraped/mindat_images/basalt/Basalt3.png",
    "https://storage.googleapis.com/minerals-app-480613.firebasestorage.app/scraped/mindat_images/basalt/Basalt31.png",
    "https://storage.googleapis.com/minerals-app-480613.firebasestorage.app/scraped/mindat_images/basalt/Basalt46.png",
    "https://storage.googleapis.com/minerals-app-480613.firebasestorage.app/scraped/mindat_images/basalt/Basalt5.png",
    "https://storage.googleapis.com/minerals-app-480613.firebasestorage.app/scraped/mindat_images/basalt/Basalt8.png",
  ],
  granite: [
    "https://storage.googleapis.com/minerals-app-480613.firebasestorage.app/scraped/mindat_images/granite/Granite0.png",
    "https://storage.googleapis.com/minerals-app-480613.firebasestorage.app/scraped/mindat_images/granite/Granite1.png",
    "https://storage.googleapis.com/minerals-app-480613.firebasestorage.app/scraped/mindat_images/granite/Granite17.png",
    "https://storage.googleapis.com/minerals-app-480613.firebasestorage.app/scraped/mindat_images/granite/Granite2.png",
    "https://storage.googleapis.com/minerals-app-480613.firebasestorage.app/scraped/mindat_images/granite/Granite20.png",
    "https://storage.googleapis.com/minerals-app-480613.firebasestorage.app/scraped/mindat_images/granite/Granite4.png",
    "https://storage.googleapis.com/minerals-app-480613.firebasestorage.app/scraped/mindat_images/granite/Granite42.png",
    "https://storage.googleapis.com/minerals-app-480613.firebasestorage.app/scraped/mindat_images/granite/Granite43.png",
    "https://storage.googleapis.com/minerals-app-480613.firebasestorage.app/scraped/mindat_images/granite/Granite45.png",
    "https://storage.googleapis.com/minerals-app-480613.firebasestorage.app/scraped/mindat_images/granite/Granite50.png",
    "https://storage.googleapis.com/minerals-app-480613.firebasestorage.app/scraped/mindat_images/granite/Granite56.png",
    "https://storage.googleapis.com/minerals-app-480613.firebasestorage.app/scraped/mindat_images/granite/Granite6.png",
  ],
  jasper: [
    "https://storage.googleapis.com/minerals-app-480613.firebasestorage.app/scraped/mindat_images/jasper/jasper_0.jpg",
    "https://storage.googleapis.com/minerals-app-480613.firebasestorage.app/scraped/mindat_images/jasper/jasper_1.jpg",
    "https://storage.googleapis.com/minerals-app-480613.firebasestorage.app/scraped/mindat_images/jasper/jasper_13.jpg",
    "https://storage.googleapis.com/minerals-app-480613.firebasestorage.app/scraped/mindat_images/jasper/jasper_2.jpg",
    "https://storage.googleapis.com/minerals-app-480613.firebasestorage.app/scraped/mindat_images/jasper/jasper_21.jpg",
    "https://storage.googleapis.com/minerals-app-480613.firebasestorage.app/scraped/mindat_images/jasper/jasper_25.jpg",
    "https://storage.googleapis.com/minerals-app-480613.firebasestorage.app/scraped/mindat_images/jasper/jasper_3.jpg",
    "https://storage.googleapis.com/minerals-app-480613.firebasestorage.app/scraped/mindat_images/jasper/jasper_4.jpg",
    "https://storage.googleapis.com/minerals-app-480613.firebasestorage.app/scraped/mindat_images/jasper/jasper_40.jpg",
    "https://storage.googleapis.com/minerals-app-480613.firebasestorage.app/scraped/mindat_images/jasper/jasper_44.jpg",
    "https://storage.googleapis.com/minerals-app-480613.firebasestorage.app/scraped/mindat_images/jasper/jasper_8.jpg",
    "https://storage.googleapis.com/minerals-app-480613.firebasestorage.app/scraped/mindat_images/jasper/jasper_9.jpg",
  ],
  obsidian: [
    "https://storage.googleapis.com/minerals-app-480613.firebasestorage.app/scraped/mindat_images/obsidian/8519",
    "https://storage.googleapis.com/minerals-app-480613.firebasestorage.app/scraped/mindat_images/obsidian/obsidian-1.webp",
    "https://storage.googleapis.com/minerals-app-480613.firebasestorage.app/scraped/mindat_images/obsidian/obsidian-2.jpeg",
    "https://storage.googleapis.com/minerals-app-480613.firebasestorage.app/scraped/mindat_images/obsidian/obsidian-3.jpeg",
    "https://storage.googleapis.com/minerals-app-480613.firebasestorage.app/scraped/mindat_images/obsidian/obsidian-4.jpg",
    "https://storage.googleapis.com/minerals-app-480613.firebasestorage.app/scraped/mindat_images/obsidian/obsidian-5.jpg",
    "https://storage.googleapis.com/minerals-app-480613.firebasestorage.app/scraped/mindat_images/obsidian/obsidian.jpg",
  ],
  tigers_eye: [
    "https://storage.googleapis.com/minerals-app-480613.firebasestorage.app/scraped/mindat_images/tigers_eye/3960",
    "https://storage.googleapis.com/minerals-app-480613.firebasestorage.app/scraped/mindat_images/tigers_eye/tigers%20eye_0.jpg",
    "https://storage.googleapis.com/minerals-app-480613.firebasestorage.app/scraped/mindat_images/tigers_eye/tigers%20eye_13.jpg",
    "https://storage.googleapis.com/minerals-app-480613.firebasestorage.app/scraped/mindat_images/tigers_eye/tigers%20eye_17.jpg",
    "https://storage.googleapis.com/minerals-app-480613.firebasestorage.app/scraped/mindat_images/tigers_eye/tigers%20eye_24.jpg",
    "https://storage.googleapis.com/minerals-app-480613.firebasestorage.app/scraped/mindat_images/tigers_eye/tigers%20eye_38.jpg",
    "https://storage.googleapis.com/minerals-app-480613.firebasestorage.app/scraped/mindat_images/tigers_eye/tigers%20eye_40.jpg",
    "https://storage.googleapis.com/minerals-app-480613.firebasestorage.app/scraped/mindat_images/tigers_eye/tigers%20eye_42.jpg",
    "https://storage.googleapis.com/minerals-app-480613.firebasestorage.app/scraped/mindat_images/tigers_eye/tigers%20eye_43.jpg",
    "https://storage.googleapis.com/minerals-app-480613.firebasestorage.app/scraped/mindat_images/tigers_eye/tigers%20eye_5.jpg",
  ],
  carnelian: [
    "https://storage.googleapis.com/minerals-app-480613.firebasestorage.app/scraped/mindat_images/carnelian/carnelian_0.jpg",
    "https://storage.googleapis.com/minerals-app-480613.firebasestorage.app/scraped/mindat_images/carnelian/carnelian_10.jpg",
    "https://storage.googleapis.com/minerals-app-480613.firebasestorage.app/scraped/mindat_images/carnelian/carnelian_14.jpg",
    "https://storage.googleapis.com/minerals-app-480613.firebasestorage.app/scraped/mindat_images/carnelian/carnelian_17.jpg",
    "https://storage.googleapis.com/minerals-app-480613.firebasestorage.app/scraped/mindat_images/carnelian/carnelian_2.jpg",
    "https://storage.googleapis.com/minerals-app-480613.firebasestorage.app/scraped/mindat_images/carnelian/carnelian_4.jpg",
    "https://storage.googleapis.com/minerals-app-480613.firebasestorage.app/scraped/mindat_images/carnelian/carnelian_5.jpg",
  ],
  amethyst: [
    "https://storage.googleapis.com/minerals-app-480613.firebasestorage.app/scraped/mindat_images/amethyst/amethyst_0.jpg",
    "https://storage.googleapis.com/minerals-app-480613.firebasestorage.app/scraped/mindat_images/amethyst/amethyst_11.jpg",
    "https://storage.googleapis.com/minerals-app-480613.firebasestorage.app/scraped/mindat_images/amethyst/amethyst_14.jpg",
    "https://storage.googleapis.com/minerals-app-480613.firebasestorage.app/scraped/mindat_images/amethyst/amethyst_6.jpg",
    "https://storage.googleapis.com/minerals-app-480613.firebasestorage.app/scraped/mindat_images/amethyst/amethyst_8.jpg",
    "https://storage.googleapis.com/minerals-app-480613.firebasestorage.app/scraped/mindat_images/amethyst/amethyst_9.jpg",
  ],
  moonstone: [
    "https://storage.googleapis.com/minerals-app-480613.firebasestorage.app/scraped/mindat_images/moonstone/2774",
    "https://storage.googleapis.com/minerals-app-480613.firebasestorage.app/scraped/mindat_images/moonstone/moonstone_0.jpg",
    "https://storage.googleapis.com/minerals-app-480613.firebasestorage.app/scraped/mindat_images/moonstone/moonstone_1.jpg",
    "https://storage.googleapis.com/minerals-app-480613.firebasestorage.app/scraped/mindat_images/moonstone/moonstone_14.jpg",
    "https://storage.googleapis.com/minerals-app-480613.firebasestorage.app/scraped/mindat_images/moonstone/moonstone_20.jpg",
    "https://storage.googleapis.com/minerals-app-480613.firebasestorage.app/scraped/mindat_images/moonstone/moonstone_25.jpg",
    "https://storage.googleapis.com/minerals-app-480613.firebasestorage.app/scraped/mindat_images/moonstone/moonstone_28.jpg",
    "https://storage.googleapis.com/minerals-app-480613.firebasestorage.app/scraped/mindat_images/moonstone/moonstone_31.jpg",
    "https://storage.googleapis.com/minerals-app-480613.firebasestorage.app/scraped/mindat_images/moonstone/moonstone_39.jpg",
    "https://storage.googleapis.com/minerals-app-480613.firebasestorage.app/scraped/mindat_images/moonstone/moonstone_40.jpg",
    "https://storage.googleapis.com/minerals-app-480613.firebasestorage.app/scraped/mindat_images/moonstone/moonstone_6.jpg",
  ],
};

/** Normalize name to config key (lowercase, underscores). */
function toCanonicalKey(name: string | undefined): string | undefined {
  if (!name || typeof name !== "string") return undefined;
  return name.toLowerCase().trim().replace(/\s+/g, "_").replace(/['']/g, "");
}

/**
 * Build full image URL for a mushroom match from API (match.images are filenames like "aquamarine_0.jpg").
 * Uses Firebase Storage path: scraped/mindat_images/{canonicalName}/{filename}.
 * Falls back to getFirstMushroomImageUrl(canonicalName) if no filename.
 */
export function getMushroomImageUrlFromMatch(
  canonicalName: string | undefined,
  imageFileName?: string | null
): string | undefined {
  const key = toCanonicalKey(canonicalName);
  if (!key) return undefined;
  if (
    imageFileName &&
    typeof imageFileName === "string" &&
    imageFileName.trim()
  ) {
    const path = `scraped/mindat_images/${key}/${encodeURIComponent(
      imageFileName.trim()
    )}`;
    return getFirebaseStorageUrl(path);
  }
  return getFirstMushroomImageUrl(canonicalName);
}

/**
 * Get image URL list for a mushroom by canonical name (e.g. "basalt", "tigers_eye").
 * Also matches common name variants (e.g. "Tiger's Eye" -> tigers_eye).
 */
export function getMushroomImageUrls(
  canonicalName: string | undefined
): string[] | undefined {
  const key = toCanonicalKey(canonicalName);
  if (!key) return undefined;
  return MUSHROOM_IMAGE_URLS[key];
}

/**
 * Get first image URL for a mushroom (for single-image display, e.g. list card or quiz).
 */
export function getFirstMushroomImageUrl(
  canonicalName: string | undefined
): string | undefined {
  const urls = getMushroomImageUrls(canonicalName);
  return urls?.length ? urls[0] : undefined;
}

/** Default quiz archetype images for "Which Mushroom Are You?" */
export const QUIZ_MUSHROOM_IMAGE_DEFAULTS: Record<string, string> = {
  porcini:
    "https://trackzio-mushrooms-archetypes-images.s3.amazonaws.com/boletus_edulis_bull/5954958_3.jpg",
  reishi:
    "https://trackzio-mushrooms-archetypes-images.s3.amazonaws.com/ganoderma_lucidum_curtis_pkarst/2549730_2.jpeg",
  oyster_mushroom:
    "https://trackzio-mushrooms-archetypes-images.s3.amazonaws.com/pleurotus_ostreatus_jacq_pkumm/2526530_1.jpeg",
  wild_enoki:
    "https://trackzio-mushrooms-archetypes-images.s3.amazonaws.com/flammulina_velutipes_curtis_singer/3341441_3.jpeg",
  fly_agaric:
    "https://trackzio-mushrooms-archetypes-images.s3.amazonaws.com/amanita_muscaria_l_lam/8168319_4.jpg",
  lions_mane:
    "https://trackzio-mushrooms-archetypes-images.s3.amazonaws.com/hericium_erinaceus_bull_pers/5248508_5.jpeg",
  morel:
    "https://trackzio-mushrooms-archetypes-images.s3.amazonaws.com/morchella_esculenta_l_pers/2594602_1.jpeg",
  winter_chanterelle: "",
};

/** @deprecated Use QUIZ_MUSHROOM_IMAGE_DEFAULTS */
export const QUIZ_ROCK_IMAGE_DEFAULTS = QUIZ_MUSHROOM_IMAGE_DEFAULTS;
