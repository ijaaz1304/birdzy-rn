/**
 * useStrings Hook
 * Provides easy access to centralized strings with type safety
 */

import { useMemo } from "react";
import {
  APP_STRINGS,
  formatString,
  pluralize,
  capitalize,
} from "../config/strings";

/**
 * Hook to access centralized strings
 * Usage: const strings = useStrings();
 * Then: strings.waterCalculator.screen.title
 * Or: strings.format('Hello {name}', { name: 'World' })
 */
export const useStrings = () => {
  return useMemo(() => {
    return {
      ...APP_STRINGS,
      // Helper functions
      format: formatString,
      pluralize,
      capitalize,
    };
  }, []);
};

/**
 * Hook to get strings for a specific feature/module
 * Usage: const waterStrings = useFeatureStrings('waterCalculator');
 */
export const useFeatureStrings = <K extends keyof typeof APP_STRINGS>(
  feature: K
): (typeof APP_STRINGS)[K] => {
  return useMemo(() => APP_STRINGS[feature], [feature]);
};

/**
 * Hook to get common strings (buttons, labels, placeholders)
 * Usage: const common = useCommonStrings();
 */
export const useCommonStrings = () => {
  return useMemo(() => APP_STRINGS.common, []);
};
