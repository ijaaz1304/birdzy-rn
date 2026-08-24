/**
 * Semantic color tokens for the active theme (content / border / surface).
 * Prefer over raw hex or FIGMA_TOKENS in new UI code.
 */

import { useMemo } from "react";
import {
  getComponentColors,
  getSemanticColors,
} from "../design-system/colors";
import { useIsDark } from "./useTheme";

export const useSemanticColors = () => {
  const isDark = useIsDark();
  return useMemo(
    () => getSemanticColors(isDark ? "dark" : "light"),
    [isDark]
  );
};

export const useComponentColors = () => {
  const isDark = useIsDark();
  return useMemo(
    () => getComponentColors(isDark ? "dark" : "light"),
    [isDark]
  );
};
