/**
 * Header organism component
 */

import { AppImage } from "@/components/AppImage";
import React from "react";
import { View, StyleSheet, ViewStyle, TouchableOpacity, StatusBar, ImageSourcePropType } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../hooks/useTheme";
import { Text, Icon, Button, NavBackIcon, NAV_BACK_GLYPH_SIZE } from "../../atoms";

import { spacing } from "../../design-system/spacing";

export interface HeaderProps {
  title?: string;
  subtitle?: string;
  leftIcon?: string;
  rightIcon?: string;
  /** Custom image for right icon (e.g. close/cancel). If set, used instead of rightIcon. */
  rightIconImage?: ImageSourcePropType;
  rightButton?: {
    label: string;
    onPress: () => void;
    variant?: "primary" | "secondary" | "outline" | "ghost";
  };
  onLeftIconPress?: () => void;
  onRightIconPress?: () => void;
  showBackButton?: boolean;
  onBackPress?: () => void;
  /** Custom image for back (e.g. X close). If set, used instead of the shared chevron. */
  backIconImage?: ImageSourcePropType;
  /** Width/height for `backIconImage` (Feather chevron uses this size too). */
  backIconSize?: number;
  variant?: "default" | "transparent" | "elevated";
  style?: ViewStyle;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  leftIcon,
  rightIcon,
  rightIconImage,
  rightButton,
  onLeftIconPress,
  onRightIconPress,
  showBackButton = false,
  onBackPress,
  backIconImage,
  backIconSize = NAV_BACK_GLYPH_SIZE,
  variant = "default",
  style,
}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const getHeaderStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      backgroundColor:
        variant === "transparent" ? "transparent" : theme.colors.surface,
      paddingTop: insets.top,
      ...(variant === "elevated" && theme.shadows.sm),
    };

    return baseStyle;
  };

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else if (onLeftIconPress) {
      onLeftIconPress();
    }
  };

  const shouldShowBackButton = showBackButton || (onBackPress && !leftIcon);

  return (
    <View style={[styles.container, getHeaderStyle(), style]}>
      <StatusBar
        barStyle={theme.mode === "dark" ? "light-content" : "dark-content"}
        backgroundColor={
          variant === "transparent" ? "transparent" : theme.colors.surface
        }
        translucent={false}
      />
      <View style={styles.content}>
        <View style={styles.leftSection}>
          {shouldShowBackButton && (
            <TouchableOpacity
              onPress={handleBackPress}
              style={styles.iconButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              {backIconImage ? (
                <AppImage
                  source={backIconImage}
                  style={{
                    width: backIconSize,
                    height: backIconSize,
                    tintColor: theme.colors.textPrimary || theme.colors.text,
                  }}
                  resizeMode="contain"
                />
              ) : (
                <NavBackIcon
                  size={backIconSize}
                  color={theme.colors.textPrimary || theme.colors.text}
                />
              )}
            </TouchableOpacity>
          )}
          {leftIcon && !shouldShowBackButton && (
            <TouchableOpacity
              onPress={onLeftIconPress}
              style={styles.iconButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Icon name={leftIcon} size={24} color={theme.colors.text} />
            </TouchableOpacity>
          )}
          {(title || subtitle) && (
            <View style={styles.titleContainer}>
              {title && (
                <Text
                  variant="headline"
                  size="medium"
                  weight="semibold"
                  numberOfLines={1}
                >
                  {title}
                </Text>
              )}
              {subtitle && (
                <Text
                  variant="body"
                  size="small"
                  color="textSecondary"
                  numberOfLines={1}
                  style={styles.subtitle}
                >
                  {subtitle}
                </Text>
              )}
            </View>
          )}
        </View>

        <View style={styles.rightSection}>
          {rightButton ? (
            <Button
              title={rightButton.label}
              variant={rightButton.variant || "primary"}
              size="small"
              onPress={rightButton.onPress}
            />
          ) : rightIconImage && onRightIconPress ? (
            <TouchableOpacity
              onPress={onRightIconPress}
              style={styles.iconButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <AppImage
                source={rightIconImage}
                style={{
                  width: 24,
                  height: 24,
                  tintColor: theme.colors.textPrimary || theme.colors.text,
                }}
                resizeMode="contain"
              />
            </TouchableOpacity>
          ) : rightIcon ? (
            <TouchableOpacity
              onPress={onRightIconPress}
              style={styles.iconButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Icon name={rightIcon} size={24} color={theme.colors.text} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    zIndex: 100,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[4],
    paddingVertical: 12,
    minHeight: 56,
  },
  leftSection: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  titleContainer: {
    flex: 1,
    marginLeft: 8,
  },
  subtitle: {
    marginTop: 2,
  },
});
