/**
 * FilterModal Types
 */

export type FilterCategory =
  | "edibility"
  | "toxicitySeverity"
  | "psychoactive"
  | "capShape"
  | "capSurface"
  | "undersideType"
  | "stemPresence"
  | "stemSurface"
  | "ringPresent"
  | "volvaPresent"
  | "habitatType"
  | "geographicDistribution"
  | "customLocation"
  | "scientificClassification"
  | string;

export interface FilterCategoryConfig {
  id: FilterCategory;
  label: string;
}

export interface FilterData {
  edibility?: string[];
  toxicitySeverity?: string[];
  psychoactive?: string[];
  capShape?: string[];
  capSurface?: string[];
  undersideType?: string[];
  stemPresence?: string[];
  stemSurface?: string[];
  ringPresent?: string[];
  volvaPresent?: string[];
  habitatType?: string[];
  geographicDistribution?: string[];
  customLocation?: string[];
  scientificClassification?: Record<string, string[]>;
  [key: string]: string[] | Record<string, string[]> | undefined;
}

export interface FilterState {
  [key: string]: string[];
}

export interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApplyFilters: (filters: FilterState, hasFilters: boolean) => void;
  clearAllFilters?: () => void;
  defaultFilters?: FilterState;
  comingFrom?: "Private Collection" | "global_collection";
  /** When set, filter options are built from API (e.g. archetype filteritems) instead of mock data */
  filterDataFromApi?: Record<string, string[]>;
}

export interface FilterStoreResult {
  data?: FilterData;
}
