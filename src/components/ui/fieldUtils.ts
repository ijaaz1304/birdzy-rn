import { Theme } from "../../design-system/themes";

import { SCREEN_COLORS } from "../../constants/colorConstants";

export type FieldState =
  | "normal"
  | "focus"
  | "filled"
  | "error"
  | "success"
  | "disabled";

type BorderColorParams = {
  currentState: FieldState;
  colors?: Theme["colors"];
};

/**
 * Returns the border color for any field (TextField, TextArea, PasswordField, SearchBar)
 */
export const getBorderColor = ({
  currentState,
  colors,
}: BorderColorParams): string => {
  if (!colors) {
    return SCREEN_COLORS.LIGHT.border;
  }

  switch (currentState) {
    case "focus":
      return colors.borderBrand;
    case "error":
      return colors.borderError;
    case "success":
      return colors.borderSuccess;
    case "disabled":
      return "transparent";
    default:
      return colors.textFieldBorder ?? colors.border0;
  }
};

/**
 * Returns the background color for a field
 */
export const getBackgroundColor = (
  currentState: FieldState,
  colors: Theme["colors"]
): string => {
  if (currentState === "disabled") {
    return colors.surfaceSecondary;
  }
  return colors.textFieldBackground ?? colors.surfacePrimary;
};

/**
 * Returns the text color for a field
 */
export const getTextColor = (
  disabled: boolean,
  colors: Theme["colors"]
): string => {
  return disabled ? colors.textTertiary : colors.textPrimary;
};
