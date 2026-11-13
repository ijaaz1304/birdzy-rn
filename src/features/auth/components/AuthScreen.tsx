import { AppImage } from "@/components/AppImage";
import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome5";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useTheme, useIsDark } from "../../../hooks/useTheme";
import { SUBSCRIPTION_COLORS } from "../../../constants/colorConstants";
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
  /** Outer spacing override (e.g. when the parent list sets the gap). */
  style?: StyleProp<ViewStyle>;
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
  style,
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
          borderColor: isDark
            ? theme.colors.border0
            : SUBSCRIPTION_COLORS.SECONDARY_CTA_BORDER_LIGHT,
          opacity: disabled ? 0.6 : 1,
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
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
  /**
   * Figma 8015:111041 — full width, 44pt (minimum: grows when the label wraps
   * at larger text sizes), padding 10/16, radius 23.789, 1pt #E7E7E7 border.
   */
  btn: {
    minHeight: 44,
    borderRadius: 23.789,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 12,
    borderWidth: 1,
    justifyContent: "center",
  },
  btnDark: {
    borderRadius: 24,
  },
  /** Icon + label centered, 8pt gap; the label wraps inside the button */
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  /** Figma Button/16px — Satoshi Medium 16/24 */
  text: {
    flexShrink: 1,
    textAlign: "center",
    fontSize: 16,
    lineHeight: 24,
    fontFamily: FONTS.medium,
  },
  textNoIcon: {},
  /** Figma social logo: 24pt (fixed) */
  socialIcon: {
    width: 24,
    height: 24,
  },
});
