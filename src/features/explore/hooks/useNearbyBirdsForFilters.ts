import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { exploreService } from "@/features/explore/services/explore.service";
import type {
  ExploreArchetypeCard,
  ExploreLocation,
} from "@/features/explore/services/explore.api.types";

import { getAccountSessionVersion } from "../../../services/session/accountSession";

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
  const publish = useCallback((next: State) => {
    stateRef.current = next;
    setState(next);
  }, []);
  const controller = useRef<AbortController | null>(null);
  const generation = useRef(0);
  const pending = useRef(false);
  const session = getAccountSessionVersion();
  const lat = location?.lat;
  const lng = location?.lng;

  const cancel = useCallback(() => {
    generation.current++;
    pending.current = false;
    controller.current?.abort();
    controller.current = null;
  }, []);
  useEffect(() => {
    cancel();
    // Reset the imperative snapshot too: another effect in this commit may read it.
    publish(initialState);
    return cancel;
  }, [lat, lng, session, cancel, publish]);

  const loadNext = useCallback(async () => {
    if (lat == null || lng == null) return;
    const before = stateRef.current;
    if (pending.current || before.isLoading) return;
    pending.current = true;
    const owner = getAccountSessionVersion();
    const requestGeneration = generation.current;
    const request = new AbortController();
    controller.current = request;
    publish({ ...before, isLoading: true, error: null });
    try {
      const result = await exploreService.fetchExploreNearYou(
        { location: { lat, lng } },
        {
          pageNo: before.pagesLoaded + 1,
          pageSize: PAGE_SIZE,
          tab: "yearRound",
        },
        request.signal
      );
      if (
        generation.current !== requestGeneration ||
        owner !== getAccountSessionVersion()
      )
        return;
      const byId = new Map(
        before.cards.map((card) => [card.archetypeId, card])
      );
      result.data.forEach((card) => byId.set(card.archetypeId, card));
      const cards = [...byId.values()];
      pending.current = false;
      publish({
        cards,
        pagesLoaded: before.pagesLoaded + 1,
        // Empty, repeated (non-advancing) or final pages end the search.
        exhausted:
          !result.data.length ||
          result.pagination.pageNo <= before.pagesLoaded ||
          cards.length === before.cards.length ||
          cards.length >= result.pagination.totalCount,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      if (
        generation.current !== requestGeneration ||
        owner !== getAccountSessionVersion()
      )
        return;
      pending.current = false;
      publish({
        ...before,
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to load nearby birds. Please try again.",
      });
    } finally {
      if (
        generation.current === requestGeneration &&
        controller.current === request
      )
        pending.current = false;
    }
  }, [lat, lng, publish]);

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
  }, [lat, lng, matchingIds, state.isLoading, state.error, complete, loadNext]);

  /** Clearing the error lets the effect request the failed page again. */
  const retry = useCallback(() => {
    publish({ ...stateRef.current, error: null });
  }, [publish]);

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
