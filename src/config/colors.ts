/**
 * App-wide color config
 * All colors used in the app should be referenced from here or from theme (useTheme()).
 * Do not hardcode hex/rgba in components – use APP_COLORS, design-system tokens, or theme.colors.
 */

// Design system – single source of truth for palette
export {
  PRIMITIVE_COLORS,
  PRIMITIVES,
  DARK_COLORS,
  LIGHT_COLORS,
  SEMANTIC_LIGHT,
  SEMANTIC_DARK,
  COMPONENT_LIGHT,
  COMPONENT_DARK,
  getSemanticColors,
  getComponentColors,
  colors as designSystemColors,
  COLORS,
  getHex,
  FIGMA_TOKENS,
  FIGMA_DARK_TOKENS,
  DarkTheme,
} from "../design-system/colors";
export {
  darkColors,
  darkThemeTokens,
  flatDarkColors,
  type DarkColors,
  type FlatDarkColors,
} from "../theme/colors";
export type { ColorToken } from "../design-system/colors";

// Constants – mushroom accents, social, UI, subscription
export {
  MUSHROOM_COLORS,
  MINERAL_COLORS,
  SOCIAL_COLORS,
  UI_COLORS,
  SUBSCRIPTION_GRADIENTS,
} from "../constants/colorConstants";
export {
  SUBSCRIPTION_GRADIENT_COLORS,
  DISCOUNT_PILL_GRADIENT,
  SUBSCRIPTION_CTA_COLOR,
  PRICING_CARD_COLORS,
  COMPARISON_TABLE_COLORS,
} from "../constants/subscriptionColors";

// App-specific semantic tokens live outside `src` and are re-exported here.
export { APP_COLORS } from "../../theme/colors";
