/** One place for Explore endpoints, map defaults and supported map filters. */
export { API_ENDPOINTS } from "@/constants/api";
export const EXPLORE = { SEARCH_RADIUS_KM: 100 } as const;
export const EXPLORE_MAP_FILTERS = [
  "birdSize",
  "birdType",
  "conservationStatus",
  "habitat",
] as const;
