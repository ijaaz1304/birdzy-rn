import React from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { FONTS } from "../../../common/typography";
import {
  POST_AUTH_LAYOUT,
  POST_AUTH_ONBOARDING_COLORS_LIGHT,
  type PostAuthOnboardingColors,
} from "../constants";

type Props = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  colors?: PostAuthOnboardingColors;
};

export const PostAuthGradientButton: React.FC<Props> = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  style,
  colors = POST_AUTH_ONBOARDING_COLORS_LIGHT,
}) => {
  const content = loading ? (
    <ActivityIndicator color={colors.ctaTextDark} />
  ) : (
    <Text allowFontScaling={false} style={[styles.label, { color: colors.ctaTextDark }]}>{title}</Text>
  );

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.touchable,
        style,
        (disabled || loading) && styles.disabled,
      ]}
    >
      {colors.useSolidCta ? (
        <View
          style={[
            styles.ctaInner,
            { backgroundColor: colors.ctaSolidBackground },
          ]}
        >
          {content}
        </View>
      ) : (
        <LinearGradient
          colors={[...colors.ctaGradient]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          locations={[0.2429, 0.506, 0.7826]}
          style={styles.ctaInner}
        >
          {content}
        </LinearGradient>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  touchable: {
    width: "100%",
    borderRadius: POST_AUTH_LAYOUT.ctaBorderRadius,
    overflow: "hidden",
  },
  ctaInner: {
    height: POST_AUTH_LAYOUT.ctaHeight,
    borderRadius: POST_AUTH_LAYOUT.ctaBorderRadius,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  label: {
    fontFamily: FONTS.medium,
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
  },
  disabled: {
    opacity: 0.6,
  },
});
