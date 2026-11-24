import type {
  ExploreArchetypeCard,
  ExploreMapGeoJSON,
} from "@/features/explore/services/explore.api.types";
import type { FilterState } from "../../../organisms/FilterModal/types";

/**
 * The nearby list endpoint accepts only a location, so trait filters cannot be
 * sent to it. The map GeoJSON endpoint does accept them (and is already clipped
 * to the search radius), so the species it returns define which nearby birds
 * match the applied filters.
 */
export function birdsLifeIdsFromGeoJSON(
  geoJSON: ExploreMapGeoJSON
): Set<string> {
  const ids = new Set<string>();
  geoJSON.features.forEach((feature) => {
    const id = feature.properties?.birdsLifeId;
    if (id != null && String(id).trim()) ids.add(String(id));
  });
  return ids;
}

/** Matches common or scientific name; an empty query matches everything. */
export function cardMatchesQuery(
  card: ExploreArchetypeCard,
  query: string
): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return [card.commonName, card.scientificName].some((name) =>
    name?.toLowerCase().includes(needle)
  );
}

export function filteredNearbyCards(
  cards: ExploreArchetypeCard[],
  matchingIds: ReadonlySet<string>,
  query: string
): ExploreArchetypeCard[] {
  return cards.filter(
    (card) =>
      matchingIds.has(String(card.birdsLifeId)) && cardMatchesQuery(card, query)
  );
}

export function withoutFilterValue(
  filters: FilterState,
  key: string,
  value: string
): FilterState {
  const next = { ...filters };
  const remaining = (next[key] ?? []).filter((item) => item !== value);
  if (remaining.length) next[key] = remaining;
  else delete next[key];
  return next;
}

export function countFilterValues(filters: FilterState): number {
  return Object.values(filters).reduce(
    (sum, values) => sum + (values?.length ?? 0),
    0
  );
}
