/**
 * SearchBar molecule component
 * Optimized and dynamic version of AppSearchBar
 */

import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react";
import { View, TextInput, TextInputProps, TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from "react-native";
import { useTheme, useIsDark } from "../../hooks/useTheme";
import { Icon } from "../../atoms";
import { Text } from "../../atoms";
import { CancelIconLight, CancelIconDark } from "../../assets";

import { spacing } from "../../design-system/spacing";
import { UI_COLORS } from "../../constants/colorConstants";
import { DARK_SURFACE_BRAND_1 } from "../../theme/colors/dark";

export type SearchBarState =
  | "normal"
  | "focus"
  | "filled"
  | "error"
  | "success"
  | "disabled";

export interface SearchBarProps extends Omit<TextInputProps, "style"> {
  placeholder?: string;
  value: string;
  onChangeText?: (text: string) => void;
  onPressFilter?: () => void;
  onClear?: () => void;
  disabled?: boolean;
  state?: SearchBarState;
  showClearButton?: boolean;
  showFilterButton?: boolean;
  /** When `editable` is false, tapping the bar (not the filter button) invokes this. */
  onPressBar?: () => void;
  filterBadgeCount?: number;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  leftIcon?: string;
  rightIcon?: string;
}

const getBorderColor = (
  state: SearchBarState,
  theme: ReturnType<typeof useTheme>["colors"],
  isDark: boolean
): string => {
  switch (state) {
    case "focus":
      return isDark ? DARK_SURFACE_BRAND_1 : theme.borderBrand;
    case "error":
      return theme.borderError;
    case "success":
      return theme.borderSuccess;
    case "disabled":
      return "transparent";
    default:
      return isDark
        ? DARK_SURFACE_BRAND_1
        : theme.textFieldBorder ?? theme.border0;
  }
};

const getBackgroundColor = (state: SearchBarState, theme: ReturnType<typeof useTheme>): string => {
  if (state === "disabled") {
    return theme.colors.surfaceSecondary;
  }
  return theme.colors.textFieldBackground ?? theme.colors.surfacePrimary;
};

export type SearchBarRef = { focus: () => void } | null;

export const SearchBar = forwardRef<SearchBarRef, SearchBarProps>(
  function SearchBar(
    {
      placeholder = "Search",
      value,
      onChangeText,
      onPressFilter,
      onClear,
      disabled = false,
      state = "normal",
      showClearButton = true,
      showFilterButton = true,
      onPressBar,
      filterBadgeCount = 0,
      containerStyle,
      inputStyle,
      leftIcon = "search",
      rightIcon,
      editable = true,
      onFocus: onFocusProp,
      onBlur: onBlurProp,
      ...props
    },
    ref
  ) {
    const theme = useTheme();
    const isDark = useIsDark();
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<TextInput>(null);

    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
    }));

    const currentState: SearchBarState = disabled
      ? "disabled"
      : state === "error"
      ? "error"
      : state === "success"
      ? "success"
      : isFocused
      ? "focus"
      : value
      ? "filled"
      : "normal";

    const borderColor = getBorderColor(currentState, theme.colors, isDark);
    const backgroundColor = getBackgroundColor(currentState, theme);
    const textColor = disabled
      ? theme.colors.textTertiary
      : theme.colors.textPrimary;

    const hasValue = value && value.length > 0;
    const showClear = hasValue && showClearButton && !disabled;
    const showFilter = !hasValue && showFilterButton && !disabled;

    const handleClear = () => {
      onChangeText?.("");
      onClear?.();
    };

    return (
      <View
        style={[
          styles.container,
          {
            borderColor,
            backgroundColor,
            borderRadius: theme.radius.textfield,
            opacity: disabled ? 0.6 : 1,
          },
          containerStyle,
        ]}
      >
        {/* Left Icon */}
        {leftIcon && (
          <Icon
            name={leftIcon}
            size={20}
            color={theme.colors.textTertiary}
            style={styles.leftIcon}
          />
        )}

        {/* Input — when not editable, optional onPressBar handles navigation */}
        {editable || !onPressBar ? (
          <TextInput
            ref={inputRef}
            style={[
              styles.input,
              {
                color: textColor,
              },
              inputStyle,
            ]}
            placeholder={placeholder}
            placeholderTextColor={theme.colors.textTertiary}
            editable={editable && !disabled}
            value={value}
            onChangeText={onChangeText}
            onFocus={(e) => {
              setIsFocused(true);
              onFocusProp?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              onBlurProp?.(e);
            }}
            pointerEvents={editable && !disabled ? "auto" : "none"}
            {...props}
          />
        ) : (
          <TouchableOpacity
            style={styles.inputPressable}
            onPress={onPressBar}
            activeOpacity={0.8}
            disabled={disabled}
          >
            <Text
              variant="body"
              size="small"
              numberOfLines={1}
              style={[
                styles.input,
                {
                  color: value ? textColor : theme.colors.textTertiary,
                },
                inputStyle,
              ]}
            >
              {value || placeholder}
            </Text>
          </TouchableOpacity>
        )}

        {/* Right Actions */}
        {showClear && (
          <TouchableOpacity onPress={handleClear} style={styles.rightButton}>
            {isDark ? (
              <CancelIconDark width={20} height={20} />
            ) : (
              <CancelIconLight width={20} height={20} />
            )}
          </TouchableOpacity>
        )}
        {showFilter && onPressFilter && (
          <TouchableOpacity
            onPress={onPressFilter}
            style={styles.rightButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Icon
              name="filter"
              size={16}
              color={theme.colors.textPrimary}
            />
            {filterBadgeCount > 0 && (
              <View
                style={[
                  styles.filterBadge,
                  { backgroundColor: UI_COLORS.ERROR_RED },
                ]}
              >
                <Text
                  variant="body"
                  size="small"
                  style={styles.filterBadgeText}
                >
                  {filterBadgeCount > 99 ? "99+" : filterBadgeCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    paddingHorizontal: spacing[4],
    height: 48,
    width: "100%",
    overflow: "hidden",
  },
  leftIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 0,
    fontSize: 14,
  },
  inputPressable: {
    flex: 1,
    justifyContent: "center",
    minHeight: 24,
  },
  rightButton: {
    marginLeft: 8,
    padding: 4,
    position: "relative",
  },
  filterBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    lineHeight: 12,
    fontWeight: "700",
  },
});
