/**
 * Catalogue Strings
 */

export const CATALOGUE_STRINGS = {
  screen: {
    title: "Catalogue",
    search: "Search",
    totalMushroomsLabel: "birds in database",
    results: "Results",
  },
  removeFavorite: {
    title: "Do you want to remove from your wishlist?",
    message: "Are you sure you want to remove this from your wishlist?",
    cancel: "No, Thanks",
    remove: "Yes, Remove",
  },
  emptyState: {
    title: "Oops! No birds found.",
    subtitle: "Try adjusting your search or filters",
  },
  filterEmptyState: {
    title: "Oops! No birds found.",
    subtitle:
      "Hmm, we couldn't find any birds like that. Want to try a different name? Please enter at least one full word — partial words won't return results.",
  },
  searchEmptyState: {
    message:
      "Hmm, we couldn't find any birds like that. Want to try a different name? Please enter at least one full word — partial words won't return results.",
  },
  filters: {
    title: "Filters",
    apply: "Apply Filters",
    reset: "Reset",
  },
} as const;
