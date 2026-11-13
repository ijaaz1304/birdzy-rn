import { AppImage } from "@/components/AppImage";
import React from "react";
import { View, TextInput, StyleSheet, TouchableOpacity } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { APP_COLORS } from "../../config/colors";
import { Images, PASSWORD_VISIBILITY_ICON_SIZE } from "../../assets";
import { HIT_SLOP } from "../../constants/uiConstants";

import { spacing } from "../../design-system/spacing";

export const Input = React.forwardRef<TextInput, any>(
  (
    {
      secure,
      value,
      onChangeText,
      placeholder,
      toggleSecure,
      keyboardType = "default",
      maxLength,
      disabled,
      /** Override container corner radius (e.g. auth flows use 28). */
      borderRadius,
      autoCapitalize,
      /** Red border (error state). */
      hasError,
      /** Extra container style (e.g. Figma field height / margins). */
      containerStyle,
      /** Extra TextInput style (e.g. Figma Body/16 typography). */
      inputStyle,
      testID,
      onFocus,
      /** Keyboard return key ("next" / "done") and its handler — lets forms move field to field. */
      returnKeyType,
      onSubmitEditing,
      submitBehavior,
    }: any,
    ref
  ) => {
    const theme = useTheme();
    const radius =
      typeof borderRadius === "number"
        ? borderRadius
        : theme.textFieldBorderRadius;
    const eyeIconColor =
      theme.mode === "dark"
        ? APP_COLORS.modalTextOnPrimary
        : APP_COLORS.surfaceDark;

    return (
      <View
        style={[
          styles.container,
          {
            borderColor: hasError
              ? theme.colors.borderError ?? theme.colors.error
              : theme.colors.textFieldBorder ?? theme.colors.border,
            backgroundColor:
              theme.mode === "dark"
                ? theme.colors.textFieldBackground
                : theme.colors.surface,
            borderRadius: radius,
            overflow: "hidden",
          },
          containerStyle,
        ]}
      >
        <TextInput
          ref={ref}
          testID={testID}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          submitBehavior={submitBehavior}
          value={value}
          onChangeText={onChangeText}
          onFocus={onFocus}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textTertiary}
          secureTextEntry={secure}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          maxLength={maxLength}
          editable={!disabled}
          style={[
            styles.input,
            { color: theme.colors.text, backgroundColor: "transparent" },
            typeof borderRadius === "number" ? { borderRadius } : null,
            inputStyle,
          ]}
        />
        {toggleSecure && (
          <TouchableOpacity
            onPress={toggleSecure}
            hitSlop={HIT_SLOP.SMALL}
            accessibilityRole="button"
          >
            <AppImage
              source={secure ? Images.passwordEyeOff : Images.passwordEye}
              style={[styles.visibilityIcon, { tintColor: eyeIconColor }]}
              resizeMode="contain"
            />
          </TouchableOpacity>
        )}
      </View>
    );
  }
);
Input.displayName = "Input";

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    paddingHorizontal: spacing[4],
    /** Minimum, not fixed: the field grows with the user's font size so text is never clipped. */
    minHeight: 52,
    marginTop: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
  },
  visibilityIcon: {
    width: PASSWORD_VISIBILITY_ICON_SIZE,
    height: PASSWORD_VISIBILITY_ICON_SIZE,
  },
});
