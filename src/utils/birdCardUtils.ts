/**
 * Bird catalogue/collection card image helpers.
 * Canonical module — legacy imports use `mushroomCardUtils`.
 */

export {
  normalizeImageUrls,
  resolveMushroomImageUrlsForDisplay as resolveBirdImageUrlsForDisplay,
  getFirstImageUri,
  getBirdCardId,
  mapMushroomToCatalogueCard as mapBirdToCatalogueCard,
  mapMushroomToHomeCard as mapBirdToHomeCard,
} from "./mushroomCardUtils";

/** @deprecated Use resolveBirdImageUrlsForDisplay */
export { resolveMushroomImageUrlsForDisplay } from "./mushroomCardUtils";
