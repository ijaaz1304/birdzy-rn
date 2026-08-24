import { AppImage } from "@/components/AppImage";
import React from "react";
import { View, TextInput, StyleSheet, TouchableOpacity } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { APP_COLORS } from "../../config/colors";
import { Images, PASSWORD_VISIBILITY_ICON_SIZE } from "../../assets";
import { HIT_SLOP } from "../../constants/uiConstants";

import { spacing } from "../../design-system/spacing";

export const Input = ({
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
}: any) => {
  const theme = useTheme();
  const radius =
    typeof borderRadius === "number" ? borderRadius : theme.textFieldBorderRadius;
  const eyeIconColor =
    theme.mode === "dark"
      ? APP_COLORS.modalTextOnPrimary
      : APP_COLORS.surfaceDark;

  return (
    <View
      style={[
        styles.container,
        {
          borderColor: theme.colors.textFieldBorder ?? theme.colors.border,
          backgroundColor:
            theme.mode === "dark"
              ? theme.colors.textFieldBackground
              : theme.colors.surface,
          borderRadius: radius,
          overflow: "hidden",
        },
      ]}
    >
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textTertiary}
        secureTextEntry={secure}
        keyboardType={keyboardType}
        maxLength={maxLength}
        editable={!disabled}
        style={[
          styles.input,
          { color: theme.colors.text, backgroundColor: "transparent" },
          typeof borderRadius === "number" ? { borderRadius } : null,
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
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    paddingHorizontal: spacing[4],
    height: 52,
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
