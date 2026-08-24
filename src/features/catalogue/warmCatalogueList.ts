/**
 * Warm catalogue "All" tab list + thumbnail cache from Home (or refresh).
 * Populates useBirdsStore so Catalogue opens with data and FastImage cache ready.
 */

import { InteractionManager } from "react-native";
import { PAGINATION, AUTH_WAIT } from "../../constants/appConstants";
import { waitForAuthentication } from "../../utils/authUtils";
import { isSessionExpiryError } from "../../services/api/errors";
import {
  mapMushroomToCatalogueCard,
  type MushroomLike,
} from "../../utils/mushroomCardUtils";
import {
  awaitPrefetchRemoteImages,
  prefetchRemoteImages,
} from "../../utils/prefetchImages";
import { useBirdsStore } from "./birds.store";

/** First-screen catalogue thumbnails to preload while user is on Home. */
export const CATALOGUE_IMAGE_PREFETCH_LIMIT = 50;

/** Thumbnails to fully warm before Catalogue opens (first ~2 rows in 2-col grid). */
const CATALOGUE_IMAGE_AWAIT_LIMIT = 24;
const CATALOGUE_IMAGE_AWAIT_TIMEOUT_MS = 5000;

function getCatalogueThumbnailUris(): string[] {
  const mushrooms = useBirdsStore.getState().mushrooms;
  return mushrooms
    .map((mineral) => {
      const card = mapMushroomToCatalogueCard(mineral as MushroomLike);
      return card.imageUrls?.[0] ?? card.image?.uri;
    })
    .filter((uri): uri is string => typeof uri === "string" && uri.length > 0);
}

export function prefetchCatalogueListImages(
  limit = CATALOGUE_IMAGE_PREFETCH_LIMIT
): void {
  const thumbs = getCatalogueThumbnailUris();
  if (thumbs.length === 0) return;
  prefetchRemoteImages(thumbs, limit);
}

function awaitFirstScreenCatalogueImages(): void {
  const thumbs = getCatalogueThumbnailUris();
  if (thumbs.length === 0) return;
  void awaitPrefetchRemoteImages(
    thumbs,
    CATALOGUE_IMAGE_AWAIT_LIMIT,
    CATALOGUE_IMAGE_AWAIT_TIMEOUT_MS
  );
}

/** Prefetch + await first-screen thumbnails (e.g. when Catalogue opens with warm data). */
export function warmCatalogueListThumbnailCache(): void {
  prefetchCatalogueListImages();
  awaitFirstScreenCatalogueImages();
}

export async function warmCatalogueList(options?: {
  force?: boolean;
}): Promise<void> {
  try {
    const isReady = await waitForAuthentication(
      AUTH_WAIT.MAX_WAIT_TIME_MS,
      AUTH_WAIT.CHECK_INTERVAL_MS
    );
    if (!isReady) return;

    const store = useBirdsStore.getState();
    const shouldFetch =
      options?.force ||
      !store.allTabPrimed ||
      store.mushrooms.length === 0;

    if (shouldFetch) {
      await store.fetchMushrooms(
        PAGINATION.INITIAL_PAGE,
        PAGINATION.CATALOGUE_PAGE_SIZE,
        false,
        store.mushrooms.length > 0
      );
    }

    warmCatalogueListThumbnailCache();

    InteractionManager.runAfterInteractions(() => {
      warmCatalogueListThumbnailCache();
    });
  } catch (error) {
    if (!isSessionExpiryError(error)) {
      console.error("Error warming catalogue list:", error);
    }
  }
}

export function isCatalogueAllTabWarm(): boolean {
  const { allTabPrimed, mushrooms } = useBirdsStore.getState();
  return allTabPrimed && mushrooms.length > 0;
}
