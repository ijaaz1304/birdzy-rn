/**
 * Explore Near You Strings
 */

export const EXPLORE_STRINGS = {
  emptyState: {
    title: "No birds found in this area.",
    subtitle:
      "We couldn't find any bird activity in the current map area. Try exploring nearby areas.",
  },
  /** The same, while filters are applied: points at the filters first. */
  filteredEmptyState: {
    title: "No birds found in this area.",
    subtitle:
      "We couldn't find bird activity near the selected location with these filters. Try changing the filters or searching another location.",
  },
  /** Shown when nothing is found but the map is zoomed out past what is searched. */
  wideEmptyState: {
    title: "Zoom in to see birds.",
    subtitle:
      "This view is too wide to search, so only the area around the middle of the map is checked. Zoom in on the map to see the birds nearby.",
  },
  errorState: {
    title: "Something went wrong.",
    subtitle:
      "We couldn't load birds for this area right now. Please try again in a moment.",
  },
};

export const EXPLORE_HOME_STRINGS = {
  title: "Explore Near You",
  description: "Discover birds around you",
  exploreMap: "Explore Map",
  enableLocation: "Enable Location",
  growingNow: "Spotted Now",
  yearRound: "Year-round",
};

/** Screen labels and accessibility copy. */
export const EXPLORE_COPY = {
  title: "Explore Near You",
  back: "Back",
  mapFilters: "Map filters",
  spottedNow: "Spotted Now",
  yearRound: "Year-round",
  activityAreas: "Bird Sighting Areas",
  selectedArea: "Selected Area",
  currentLocation: "Current Location:",
  loadingActivity: "Loading bird activity",
  retryMapActivity: "Retry map activity",
  clearSelection: "Clear map selection",
  clear: "Clear",
  locating: "Finding your location…",
  searchToExplore: "Search for a location to explore nearby birds.",
  retryLocation: "Retry current location",
  filterUnavailable:
    "Filter options are unavailable. Tap Map filters to retry.",
  filterFailed: "Unable to load filter options. Tap Map filters to retry.",
  loadingMap: "Loading map",
  mapFailed: "Unable to load the map.",
  mapUnavailable:
    "Map unavailable. You can still search for a place and browse nearby birds.",
  retryMap: "Retry loading map",
  retry: "Retry",
  zoomIn: "Zoom in",
  zoomOut: "Zoom out",
  recenter: "Recenter on selected location",
  expand: "Expand map",
  closeMap: "Close expanded map",
  enterLocation: "Enter location",
  searchLocation: "Search location",
  clearSearch: "Clear location search",
  searching: "Searching locations…",
  noMatches: "No matches",
  wishlist: "Wishlist",
  wishlistError: "Unable to update your wishlist. Please try again.",
  retryBirds: "Retry loading birds",
  loadingBirds: "Loading nearby birds",
  selectionEmpty: "No loaded birds match this selection in the current tab.",
  moreBirds: "Loading more birds",
  loadSelection: "Load more results for selected group",
  loadSelectionText: "Load more results for this selection",
} as const;

export const EXPLORE_SCOPE_DESCRIPTION = (radiusKm: number) =>
  `Map filters affect activity within ${radiusKm} km. Nearby birds are ranked by distance; map activity covers all seasons.`;
