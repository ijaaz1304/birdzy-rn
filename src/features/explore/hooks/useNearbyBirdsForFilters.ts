import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { exploreService } from "@/features/explore/services/explore.service";
import type {
  ExploreArchetypeCard,
  ExploreLocation,
} from "@/features/explore/services/explore.api.types";

const PAGE_SIZE = 20;
/** Upper bound on list pages read to resolve filtered species (20 × 15 = 300 birds). */
export const MAX_FILTER_RESULT_PAGES = 15;

type State = {
  cards: ExploreArchetypeCard[];
  pagesLoaded: number;
  exhausted: boolean;
  isLoading: boolean;
  error: string | null;
};

const initialState: State = {
  cards: [],
  pagesLoaded: 0,
  exhausted: false,
  isLoading: false,
  error: null,
};

/**
 * Reads the year-round nearby list (every species near the location) page by
 * page until each filtered species is found, the list ends, or the page cap is
 * reached. Matching itself happens in the caller.
 */
export function useNearbyBirdsForFilters(
  location: ExploreLocation | null,
  matchingIds: ReadonlySet<string> | null
) {
  const [state, setState] = useState<State>(initialState);
  const stateRef = useRef(state);
  stateRef.current = state;
  const controller = useRef<AbortController | null>(null);
  const generation = useRef(0);
  const lat = location?.lat;
  const lng = location?.lng;

  useEffect(() => {
    generation.current++;
    controller.current?.abort();
    controller.current = null;
    setState(initialState);
    return () => {
      generation.current++;
      controller.current?.abort();
    };
  }, [lat, lng]);

  const loadNext = useCallback(async () => {
    if (lat == null || lng == null) return;
    const before = stateRef.current;
    if (before.isLoading) return;
    const requestGeneration = generation.current;
    const request = new AbortController();
    controller.current = request;
    setState({ ...before, isLoading: true, error: null });
    try {
      const result = await exploreService.fetchExploreNearYou(
        { location: { lat, lng } },
        { pageNo: before.pagesLoaded + 1, pageSize: PAGE_SIZE, tab: "yearRound" },
        request.signal
      );
      if (generation.current !== requestGeneration) return;
      const byId = new Map(
        before.cards.map((card) => [card.archetypeId, card])
      );
      result.data.forEach((card) => byId.set(card.archetypeId, card));
      const cards = [...byId.values()];
      setState({
        cards,
        pagesLoaded: before.pagesLoaded + 1,
        // Empty, repeated (non-advancing) or final pages end the search.
        exhausted:
          !result.data.length ||
          cards.length === before.cards.length ||
          cards.length >= result.pagination.totalCount,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      if (generation.current !== requestGeneration) return;
      setState({
        ...before,
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to load nearby birds. Please try again.",
      });
    }
  }, [lat, lng]);

  const loadedIds = useMemo(
    () => new Set(state.cards.map((card) => String(card.birdsLifeId))),
    [state.cards]
  );
  const unresolved =
    !!matchingIds && [...matchingIds].some((id) => !loadedIds.has(id));
  const complete =
    state.exhausted ||
    state.pagesLoaded >= MAX_FILTER_RESULT_PAGES ||
    (!!matchingIds && !unresolved);

  useEffect(() => {
    if (lat == null || lng == null || !matchingIds) return;
    if (state.isLoading || state.error || complete) return;
    void loadNext();
  }, [
    lat,
    lng,
    matchingIds,
    state.isLoading,
    state.error,
    complete,
    loadNext,
  ]);

  /** Clearing the error lets the effect request the failed page again. */
  const retry = useCallback(() => {
    setState((current) => ({ ...current, error: null }));
  }, []);

  return {
    cards: state.cards,
    isLoading: state.isLoading,
    error: state.error,
    /** True once every filtered species is resolved or no more pages will be read. */
    complete,
    /** The page cap stopped the search before every filtered species was found. */
    truncated:
      state.pagesLoaded >= MAX_FILTER_RESULT_PAGES &&
      !state.exhausted &&
      unresolved,
    retry,
  };
}
