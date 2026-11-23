/** Explore-specific colors from Figma; keep map circles and their legend in sync. */
export const EXPLORE_COLORS = {
  searchBorder: "#785284",
  /** Figma 9376:267165 tab-atom active: Text & icon-Brand 1 #785284 (light). */
  activeTab: "#785284",
  inactiveTab: "#5D5D5D",
  sightingsStroke: "#22C55E",
  sightingsFill: "#159945",
  sightingsOpacity: 0.1,
  sightingsBackground: "rgba(21,153,69,0.1)",
  /** Figma "Selected Area": #785284 stroke (was #402122, invisible on the dark map). */
  selectedStroke: "#785284",
  selectedFill: "#725481",
  selectedOpacity: 0.2,
  selectedBackground: "rgba(114,84,129,0.2)",
  /** Dark mode "Selected Area" (design request): teal rgba(22, 182, 180, 1) ring + 20% fill. */
  selectedStrokeDark: "#16B6B4",
  selectedFillDark: "#16B6B4",
  selectedBackgroundDark: "rgba(22,182,180,0.2)",
  /** Brand outline along the home/catalogue map-banner edge. */
  mapOutlineLight: "#C7630C",
  mapOutlineDark: "#F7B23A",
  /** Thin border around the standalone Catalogue map panel. */
  panelBorderLight: "#EAD3AD",
  panelBorderDark: "#3A2E1C",
} as const;
