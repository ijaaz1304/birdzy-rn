import { AppImage } from "@/components/AppImage";
import React from "react";
import { TouchableOpacity, Text, StyleSheet, View } from "react-native";
import Icon from "react-native-vector-icons/FontAwesome5";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useTheme, useIsDark } from "../../../hooks/useTheme";
import { Images } from "../../../assets";

import { FONTS } from "../../../common/typography";

interface Props {
  icon?: string;
  text: string;
  color: string;
  onPress?: () => void;
  disabled?: boolean;
  /** When false, renders text-only CTA (e.g. Continue as guest). */
  showIcon?: boolean;
  /** Override button background (e.g. light #FFFFFF, dark #111111 for social CTAs). */
  buttonBackgroundColor?: string;
  /** Tint for PNG social icons (e.g. email envelope). */
  iconTintColor?: string;
  /** Use Ionicons instead of FontAwesome / image assets for the leading icon. */
  iconLibrary?: "fontawesome" | "ionicons";
}

const getSocialImage = (icon: string, isDark?: boolean) => {
  switch (icon.toLowerCase()) {
    case "apple":
      return isDark ? Images.socialAppleDark : Images.socialApple;
    case "google":
      return Images.socialGoogle;
    case "facebook":
      return Images.socialFacebook;
    case "email":
      return Images.socialEmail;
    default:
      return null;
  }
};

export const AuthButton: React.FC<Props> = ({
  icon = "",
  text,
  color,
  onPress,
  disabled = false,
  showIcon = true,
  buttonBackgroundColor,
  iconTintColor,
  iconLibrary = "fontawesome",
}) => {
  const theme = useTheme();
  const isDark = useIsDark();
  const socialImage =
    showIcon && iconLibrary === "ionicons"
      ? null
      : showIcon
        ? getSocialImage(icon, theme.mode === "dark")
        : null;
  const bg = buttonBackgroundColor ?? theme.colors.background;
  const iconColor = iconTintColor ?? color;

  const renderIcon = () => {
    if (!showIcon) {
      return null;
    }
    if (socialImage) {
      const tintEmail = icon.toLowerCase() === "email";
      return (
        <AppImage
          source={socialImage}
          style={[
            styles.socialIcon,
            tintEmail ? { tintColor: iconColor } : null,
          ]}
          resizeMode="contain"
          preferRNImage={tintEmail}
        />
      );
    }
    if (iconLibrary === "ionicons") {
      return <Ionicons name={icon} size={20} color={iconColor} />;
    }
    return <Icon name={icon} size={20} color={iconColor} />;
  };

  return (
    <TouchableOpacity
      style={[
        styles.btn,
        isDark && styles.btnDark,
        {
          backgroundColor: bg,
          borderColor: isDark ? theme.colors.border0 : theme.colors.border,
          opacity: disabled ? 0.6 : 1,
        },
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={styles.row}>
        {renderIcon()}
        <Text
          style={[
            styles.text,
            {
              color: showIcon ? theme.colors.text : color,
            },
            !showIcon && styles.textNoIcon,
          ]}
        >
          {text}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: {
    borderRadius: 28,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginTop: 12,
    borderWidth: 1,
  },
  btnDark: {
    borderRadius: 24,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    marginLeft: 10,
    fontSize: 15,
    fontFamily: FONTS.bold,
  },
  textNoIcon: {
    marginLeft: 0,
  },
  socialIcon: {
    width: 20,
    height: 20,
  },
});
