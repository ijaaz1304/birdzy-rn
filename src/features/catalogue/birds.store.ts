/**
 * Birds Store — catalogue list, search, filters, wishlist sync.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { mushroomsRepository } from "../../lib/repositories/mushrooms.repository";
import { MushroomDetail, MushroomListItem } from "../../types/mushrooms.types";


import { useWishlistInvalidationStore } from "../collection/wishlistInvalidation.store";
import { analyticsService } from "../../services/analytics/analytics.service";
import { EVENTS } from "../../services/analytics/analytics.events";

interface MushroomsState {
  // Data
  mushrooms: MushroomListItem[];
  selectedMushroom: MushroomDetail | null;
  userCollection: MushroomListItem[];
  favorites: string[]; // IDs of favorited minerals
  /** IDs removed from wishlist this session — ignore stale API isWishlisted until it catches up. */
  suppressedWishlistIds: string[];

  // UI State
  isLoading: boolean;
  error: string | null;
  currentPage: number;
  totalCount: number;

  // Filters
  activeFilters: Record<string, any>;
  searchQuery: string;
  /** True when unfiltered All-tab page 0 is loaded (e.g. from Home prefetch). */
  allTabPrimed: boolean;

  // Actions
  fetchMushrooms: (
    pageNo?: number,
    pageSize?: number,
    append?: boolean,
    /** Keep current list visible while fetching (smooth category tab switches). */
    keepPrevious?: boolean
  ) => Promise<void>;
  fetchMushroomDetail: (id: string) => Promise<void>;
  searchMushrooms: (
    query: string,
    filters?: Record<string, any>
  ) => Promise<void>;
  filterMushrooms: (
    filters: Record<string, any>,
    pageNo?: number,
    pageSize?: number,
    append?: boolean,
    /** Keep current list visible while fetching (smooth category tab switches). */
    keepPrevious?: boolean
  ) => Promise<void>;
  /**
   * Reason for the last failed toggleFavorite (server/validation message), for toasts.
   * Kept separate from `error` so a wishlist failure doesn't look like a list-load error.
   */
  lastFavoriteError: string | null;
  /** Returns "added" | "removed" on success, null on failure (see lastFavoriteError). */
  toggleFavorite: (
    mushroomId: string
  ) => Promise<"added" | "removed" | null>;
  /** Sync: add/remove from local favorites when wishlist is changed elsewhere (e.g. WishlistScreen, CollectionDetailsScreen). */
  addFavorite: (mushroomId: string) => void;
  removeFavorite: (mushroomId: string) => void;
  /**
   * Un-star a bird removed from the wishlist when its archetype ID may be
   * missing or wrong (Wishlist specimens can lack `_archetype`): also matches
   * loaded catalogue cards by BirdLife ID, then scientific name.
   * Returns the archetype IDs that were cleared.
   */
  removeFavoriteForBird: (bird: {
    archetypeId?: string | null;
    birdsLifeId?: string | null;
    scientificName?: string | null;
  }) => string[];
  /**
   * Put back a catalogue tab's saved list (tab switch). Its isWishlisted flags
   * are from when it was saved, so they are replaced by today's favorites.
   */
  restoreCachedList: (cached: {
    mushrooms: MushroomListItem[];
    totalCount: number;
    currentPage: number;
  }) => void;
  addToCollection: (mushroomId: string) => Promise<void>;
  removeFromCollection: (mushroomId: string) => Promise<void>;
  clearSearch: () => void;
  clearFilters: () => void;
  /** When user has scrolled past first 100 and leaves catalogue, clear extra pages. */
  clearPaginationBeyondFirstPage: () => void;
  reset: () => void;
}

const initialState = {
  mushrooms: [],
  selectedMushroom: null,
  userCollection: [],
  favorites: [],
  suppressedWishlistIds: [],
  isLoading: false,
  error: null,
  lastFavoriteError: null,
  currentPage: 0,
  totalCount: 0,
  activeFilters: {},
  searchQuery: "",
  allTabPrimed: false,
};

/** Ignores out-of-order list responses when user switches tabs quickly. */
let listFetchGeneration = 0;

function mushroomListId(m: MushroomListItem): string | undefined {
  return m.archetypeId ?? (m as { id?: string }).id;
}

function addSuppressedId(ids: string[], mushroomId: string): string[] {
  return ids.includes(mushroomId) ? ids : [...ids, mushroomId];
}

function clearSuppressedId(ids: string[], mushroomId: string): string[] {
  return ids.filter((id) => id !== mushroomId);
}

/**
 * Merge API isWishlisted into local favorites (add-only for IDs in this page),
 * but never resurrect IDs the user just removed (API lag after un-wishlist).
 */
function syncFavoritesFromList(
  currentFavorites: string[],
  list: MushroomListItem[],
  suppressed: string[]
): { favorites: string[]; suppressedWishlistIds: string[] } {
  const suppressedSet = new Set(suppressed);
  const next = new Set(currentFavorites);
  for (const id of suppressedSet) next.delete(id);
  for (const m of list) {
    const id = mushroomListId(m);
    if (!id) continue;
    if (suppressedSet.has(id)) {
      if (!m.isWishlisted) suppressedSet.delete(id);
      continue;
    }
    if (m.isWishlisted) next.add(id);
  }
  return {
    favorites: Array.from(next),
    suppressedWishlistIds: Array.from(suppressedSet),
  };
}

/** Prefer local favorites when API isWishlisted lags after a toggle. */
function applyWishlistOverlay(
  list: MushroomListItem[],
  favorites: string[],
  suppressed: string[]
): MushroomListItem[] {
  if (!list.length) return list;
  const fav = new Set(favorites);
  const sup = new Set(suppressed);
  return list.map((m) => {
    const id = mushroomListId(m);
    if (!id) return m;
    const isWishlisted = sup.has(id) ? false : m.isWishlisted || fav.has(id);
    return isWishlisted === m.isWishlisted ? m : { ...m, isWishlisted };
  });
}

const normalizeName = (value?: string | null) =>
  (value ?? "").trim().toLowerCase();

/** Same species: BirdLife ID when both sides have one, else exact scientific name. */
export function catalogueItemMatchesBird(
  item: MushroomListItem,
  bird: { birdsLifeId?: string | null; scientificName?: string | null }
): boolean {
  const itemLifeId = (item as { birdsLifeId?: string }).birdsLifeId?.trim();
  const birdLifeId = bird.birdsLifeId?.trim();
  if (itemLifeId && birdLifeId) return itemLifeId === birdLifeId;
  const birdName = normalizeName(bird.scientificName);
  return !!birdName && normalizeName(item.scientificName) === birdName;
}

/**
 * A saved list was synced into `favorites` when it was fetched, and every
 * wishlist change since (Catalogue star, Wishlist screen, bird details) updated
 * `favorites`, so `favorites` — not the saved flag — is the current answer.
 */
export function applySavedListWishlistState(
  list: MushroomListItem[],
  favorites: string[],
  suppressed: string[]
): MushroomListItem[] {
  const fav = new Set(favorites);
  const sup = new Set(suppressed);
  return list.map((m) => {
    const id = mushroomListId(m);
    if (!id) return m;
    const isWishlisted = !sup.has(id) && fav.has(id);
    return isWishlisted === Boolean(m.isWishlisted)
      ? m
      : { ...m, isWishlisted };
  });
}

function applyListWishlistState(
  currentFavorites: string[],
  suppressed: string[],
  list: MushroomListItem[]
) {
  const synced = syncFavoritesFromList(currentFavorites, list, suppressed);
  return {
    ...synced,
    mushrooms: applyWishlistOverlay(
      list,
      synced.favorites,
      synced.suppressedWishlistIds
    ),
  };
}

export const useBirdsStore = create<MushroomsState>()(
  persist(
    (set, get) => ({
      ...initialState,

      fetchMushrooms: async (
        pageNo = 0,
        pageSize = 10,
        append = false,
        keepPrevious = false
      ) => {
        const generation = append
          ? listFetchGeneration
          : ++listFetchGeneration;
        // Always fetch from API. previous "first 100" caching / randomization removed
        // Clear list when switching context unless keepPrevious (tab switch UX).
        set({
          isLoading: !append,
          error: null,
          ...(append || keepPrevious ? {} : { mushrooms: [], totalCount: 0 }),
        });
        try {
          const currentState = get();

          // Avoid re-fetching same page when appending
          if (append && pageNo <= currentState.currentPage) {
            if (generation === listFetchGeneration) {
              set({ isLoading: false });
            }
            return;
          }

          const response = await mushroomsRepository.getMushrooms({
            pageNo,
            pageSize,
          });

          if (generation !== listFetchGeneration) {
            return;
          }
          // Re-read after the await: a wishlist add/remove made while this page
          // was loading (e.g. in Collection → Wishlist) must not be overwritten.
          const stateAfter = get();

          if (append) {
            const existingIds = new Set(
              stateAfter.mushrooms.map((m) => m.archetypeId ?? (m as any).id)
            );
            const newItems = (response.data ?? []).filter(
              (m: MushroomListItem) =>
                !existingIds.has(m.archetypeId ?? (m as any).id)
            );
            const merged = [...stateAfter.mushrooms, ...newItems];
            const cap = stateAfter.totalCount;
            const capped = cap > 0 ? merged.slice(0, cap) : merged;
            const wishlistState = applyListWishlistState(
              stateAfter.favorites,
              stateAfter.suppressedWishlistIds,
              capped
            );
            set({
              mushrooms: wishlistState.mushrooms,
              favorites: wishlistState.favorites,
              suppressedWishlistIds: wishlistState.suppressedWishlistIds,
              currentPage: response.pagination.pageNo,
              totalCount: stateAfter.totalCount,
              isLoading: false,
              allTabPrimed: true,
            });
          } else {
            // initial load or refresh
            const list = response.data ?? [];
            const wishlistState = applyListWishlistState(
              stateAfter.favorites,
              stateAfter.suppressedWishlistIds,
              list
            );
            set({
              mushrooms: wishlistState.mushrooms,
              favorites: wishlistState.favorites,
              suppressedWishlistIds: wishlistState.suppressedWishlistIds,
              currentPage: response.pagination.pageNo,
              totalCount: response.pagination.totalCount,
              isLoading: false,
              allTabPrimed: true,
            });
          }
        } catch (error) {
          if (generation !== listFetchGeneration) {
            return;
          }
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to fetch birds";
          set({ error: errorMessage, isLoading: false });
        }
      },

      fetchMushroomDetail: async (id: string) => {
        // Optimistic: Check if we already have this mineral in cache
        const state = get();
        const cachedId =
          state.selectedMushroom?.archetypeId ?? state.selectedMushroom?._id;
        if (cachedId === id) {
          return; // Already loaded, skip
        }

        set({ isLoading: true, error: null });
        try {
          const mineral = await mushroomsRepository.getMushroomDetail(id);
          if (mineral) {
            // Single batched update
            set({ selectedMushroom: mineral, isLoading: false, error: null });
          } else {
            set({ error: "Bird not found", isLoading: false });
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to fetch bird details";
          set({ error: errorMessage, isLoading: false });
        }
      },

      searchMushrooms: async (query: string, filters?: Record<string, any>) => {
        const activeFilters = filters ?? {};
        set({
          isLoading: true,
          error: null,
          searchQuery: query,
          activeFilters,
          allTabPrimed: false,
          mushrooms: [],
          totalCount: 0,
        });
        try {
          const response = await mushroomsRepository.searchMushrooms(
            query,
            {},
            Object.keys(activeFilters).length > 0 ? activeFilters : undefined
          );
          const list = response.data ?? [];
          const wishlistState = applyListWishlistState(
            get().favorites,
            get().suppressedWishlistIds,
            list
          );
          set({
            mushrooms: wishlistState.mushrooms,
            favorites: wishlistState.favorites,
            suppressedWishlistIds: wishlistState.suppressedWishlistIds,
            currentPage: 0,
            totalCount: response.pagination.totalCount,
            isLoading: false,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Search failed";
          set({ error: errorMessage, isLoading: false });
        }
      },

      filterMushrooms: async (
        filters: Record<string, any>,
        pageNo = 0,
        pageSize = 10,
        append = false,
        keepPrevious = false
      ) => {
        const generation = append
          ? listFetchGeneration
          : ++listFetchGeneration;
        // Clear list when switching context unless keepPrevious (tab switch UX).
        set({
          isLoading: !append,
          error: null,
          activeFilters: filters,
          allTabPrimed: false,
          ...(append || keepPrevious ? {} : { mushrooms: [], totalCount: 0 }),
        });
        try {
          const currentState = get();
          if (append && pageNo <= currentState.currentPage) {
            if (generation === listFetchGeneration) {
              set({ isLoading: false });
            }
            return;
          }
          const response = await mushroomsRepository.filterMushrooms({
            ...filters,
            pageNo,
            pageSize,
          });
          if (generation !== listFetchGeneration) {
            return;
          }
          const stateAfter = get();
          const merged = append
            ? (() => {
                const existingIds = new Set(
                  stateAfter.mushrooms.map(
                    (m) => m.archetypeId ?? (m as any).id
                  )
                );
                const newItems = (response.data ?? []).filter(
                  (m: MushroomListItem) =>
                    !existingIds.has(m.archetypeId ?? (m as any).id)
                );
                return [...stateAfter.mushrooms, ...newItems];
              })()
            : response.data;
          const cap = stateAfter.totalCount;
          const capped = append && cap > 0 ? merged.slice(0, cap) : merged;
          const wishlistState = applyListWishlistState(
            stateAfter.favorites,
            stateAfter.suppressedWishlistIds,
            capped ?? []
          );
          set({
            mushrooms: wishlistState.mushrooms,
            favorites: wishlistState.favorites,
            suppressedWishlistIds: wishlistState.suppressedWishlistIds,
            currentPage: response.pagination.pageNo,
            totalCount: append
              ? stateAfter.totalCount
              : response.pagination.totalCount,
            isLoading: false,
          });
        } catch (error) {
          if (generation !== listFetchGeneration) {
            return;
          }
          const errorMessage =
            error instanceof Error ? error.message : "Filtering failed";
          set({ error: errorMessage, isLoading: false });
        }
      },

      toggleFavorite: async (mushroomId: string) => {
        const { favorites, mushrooms, suppressedWishlistIds } = get();
        const isCurrentlyFavorite = suppressedWishlistIds.includes(mushroomId)
          ? false
          : favorites.includes(mushroomId) ||
            mushrooms.some(
              (m) =>
                (m.archetypeId ?? (m as { id?: string }).id) === mushroomId &&
                m.isWishlisted
            );
        const nextWishlisted = !isCurrentlyFavorite;
        const optimisticFavorites = nextWishlisted
          ? favorites.includes(mushroomId)
            ? favorites
            : [...favorites, mushroomId]
          : favorites.filter((id) => id !== mushroomId);
        const previousMushrooms = mushrooms;
        const previousSuppressed = suppressedWishlistIds;
        const optimisticSuppressed = nextWishlisted
          ? clearSuppressedId(suppressedWishlistIds, mushroomId)
          : addSuppressedId(suppressedWishlistIds, mushroomId);
        const optimisticMushrooms = mushrooms.map((m) =>
          (m.archetypeId ?? (m as { id?: string }).id) === mushroomId
            ? { ...m, isWishlisted: nextWishlisted }
            : m
        );

        set({
          favorites: optimisticFavorites,
          mushrooms: optimisticMushrooms,
          suppressedWishlistIds: optimisticSuppressed,
          lastFavoriteError: null,
        });

        try {
          const success = await mushroomsRepository.toggleFavorite(
            mushroomId,
            isCurrentlyFavorite
          );
          if (success) {
            useWishlistInvalidationStore.getState().invalidate();
            analyticsService.logEvent(
              isCurrentlyFavorite
                ? EVENTS.remove_wishlist
                : EVENTS.added_to_wishlist,
              { mushroom_id: mushroomId }
            );
            return isCurrentlyFavorite ? "removed" : "added";
          }
          set({
            favorites,
            mushrooms: previousMushrooms,
            suppressedWishlistIds: previousSuppressed,
          });
          return null;
        } catch (error) {
          // Keep the real reason (e.g. "This is already identified, can't wishlist.")
          // for the toast; don't write it to `error`, which drives list-load UI.
          const errorMessage =
            error instanceof Error && error.message.trim()
              ? error.message.trim()
              : null;
          set({
            favorites,
            mushrooms: previousMushrooms,
            suppressedWishlistIds: previousSuppressed,
            lastFavoriteError: errorMessage,
          });
          return null;
        }
      },

      addFavorite: (mushroomId: string) => {
        const { favorites, mushrooms, suppressedWishlistIds } = get();
        set({
          favorites: favorites.includes(mushroomId)
            ? favorites
            : [...favorites, mushroomId],
          suppressedWishlistIds: clearSuppressedId(
            suppressedWishlistIds,
            mushroomId
          ),
          mushrooms: mushrooms.map((m) =>
            (m.archetypeId ?? (m as { id?: string }).id) === mushroomId
              ? { ...m, isWishlisted: true }
              : m
          ),
        });
      },

      removeFavorite: (mushroomId: string) => {
        const { favorites, mushrooms, suppressedWishlistIds } = get();
        set({
          favorites: favorites.filter((id) => id !== mushroomId),
          suppressedWishlistIds: addSuppressedId(
            suppressedWishlistIds,
            mushroomId
          ),
          mushrooms: mushrooms.map((m) =>
            (m.archetypeId ?? (m as { id?: string }).id) === mushroomId
              ? { ...m, isWishlisted: false }
              : m
          ),
        });
      },

      removeFavoriteForBird: (bird) => {
        const ids = new Set<string>();
        const archetypeId = bird.archetypeId?.trim();
        if (archetypeId) ids.add(archetypeId);
        for (const m of get().mushrooms) {
          const id = mushroomListId(m);
          if (id && catalogueItemMatchesBird(m, bird)) ids.add(id);
        }
        ids.forEach((id) => get().removeFavorite(id));
        return [...ids];
      },

      restoreCachedList: ({ mushrooms, totalCount, currentPage }) => {
        const { favorites, suppressedWishlistIds } = get();
        set({
          mushrooms: applySavedListWishlistState(
            mushrooms,
            favorites,
            suppressedWishlistIds
          ),
          totalCount,
          currentPage,
          isLoading: false,
          error: null,
        });
      },

      addToCollection: async (mushroomId: string) => {
        try {
          const success = await mushroomsRepository.addToCollection(mushroomId);
          if (success) {
            // Update mushrooms list to mark as identified
            const { mushrooms } = get();
            const updated = mushrooms.map((m) =>
              m.archetypeId === mushroomId ? { ...m, isIdentified: true } : m
            );
            set({ mushrooms: updated });
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to add to collection";
          set({ error: errorMessage });
        }
      },

      removeFromCollection: async (mushroomId: string) => {
        try {
          const success = await mushroomsRepository.removeFromCollection(
            mushroomId
          );
          if (success) {
            // Update mushrooms list to mark as not identified
            const { mushrooms } = get();
            const updated = mushrooms.map((m) =>
              m.archetypeId === mushroomId ? { ...m, isIdentified: false } : m
            );
            set({ mushrooms: updated });
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to remove from collection";
          set({ error: errorMessage });
        }
      },

      clearSearch: () => {
        set({ searchQuery: "", mushrooms: [], currentPage: 0, allTabPrimed: false });
      },

      clearFilters: () => {
        set({ activeFilters: {}, mushrooms: [], currentPage: 0, allTabPrimed: false });
      },

      clearPaginationBeyondFirstPage: () => {
        // paging logic removed; keep full list so infinite scroll continues after leaving screen
        // no-op for now
      },

      reset: () => {
        set(initialState);
      },
    }),
    {
      name: "birdzy-catalogue-storage",
      storage: createJSONStorage(() => ({
        getItem: async (_key: string) => {
          // Use async storage or local storage
          return null;
        },
        setItem: async (_key: string, _value: string) => {
          // Persist data
        },
        removeItem: async (_key: string) => {
          // Clear data
        },
      })),
    }
  )
);
