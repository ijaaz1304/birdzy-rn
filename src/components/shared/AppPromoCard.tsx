import { AppImage } from "@/components/AppImage";
import React from "react";
import { View, StyleSheet, ImageSourcePropType, ViewStyle, StyleProp } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import AppText from "./AppText";
import AppButton from "./AppButton";
import { useTheme, useIsDark } from "../../hooks/useTheme";
import { APP_COLORS } from "../../config/colors";

import { FONTS } from "../../common/typography";

import { Radius } from "../../design";

type Variant = "blue" | "cream" | "soil";

type Props = {
  title: string;
  subtitle: string;
  buttonText: string;
  image: ImageSourcePropType;
  onPress?: () => void;
  variant?: Variant;
  style?: StyleProp<ViewStyle>;
  countdownText?: string; // optional for soil
};

const AppPromoCard: React.FC<Props> = ({
  title,
  subtitle,
  buttonText,
  image,
  onPress,
  variant = "blue",
  style,
  countdownText,
}) => {
  const theme = useTheme();
  const colors = theme.colors;
  const _Space = theme.spacing;
  const _Radius = theme.radius;
  const isDark = useIsDark();

  const palette =
    variant === "blue"
      ? {
          bg: APP_COLORS.promoCardBlueBg,
          title: colors.textPrimary,
          sub: colors.textSecondary,
        }
      : variant === "cream"
      ? {
          bg: APP_COLORS.promoCardCreamBg,
          title: colors.textPrimary,
          sub: APP_COLORS.promoCardSoilSubText,
        }
      : {
          bg: APP_COLORS.promoCardSoilBg,
          title: isDark ? APP_COLORS.brandPrimary : APP_COLORS.brandPrimaryDark,
          sub: isDark ? APP_COLORS.brandPrimary : APP_COLORS.brandPrimaryDark,
        };

  // ✅ soil variant (new)
  if (variant === "soil") {
    return (
      <View style={[styles.card, { backgroundColor: palette.bg }, style]}>
        {/* background image */}
        <AppImage source={image} resizeMode="cover" style={styles.soilImage} />

        {/* gradient overlay */}
        <LinearGradient
          colors={[
            APP_COLORS.promoCardGradientStart,
            APP_COLORS.promoCardGradientMid,
            APP_COLORS.promoCardSoilBg,
          ]}
          style={StyleSheet.absoluteFill}
          locations={[0, 0.4, 1]}
          useAngle
          angle={270}
        />

        {/* content */}
        <View style={styles.soilContent}>
          <View style={styles.soilHeadingRow}>
            <AppText
              variant="title28"
              color={palette.title}
              style={{ fontFamily: FONTS.black, marginRight: 4 }}
            >
              {title}
            </AppText>
            <AppText
              variant="title18"
              color={palette.title}
              style={{ fontFamily: FONTS.bold }}
            >
              OFF
            </AppText>
          </View>

          <View style={styles.soilTimerRow}>
            <AppText
              variant="body14"
              color={palette.sub}
              style={{ fontFamily: FONTS.medium, marginRight: 6 }}
            >
              {subtitle}
            </AppText>

            {countdownText && (
              <View style={styles.timerBox}>
                <AppText
                  variant="body14"
                  color={APP_COLORS.error}
                  style={{ fontFamily: FONTS.bold }}
                >
                  {countdownText}
                </AppText>
              </View>
            )}
          </View>

          <AppButton
            title={buttonText}
            size="small"
            variant="primary"
            onPress={() => onPress}
            style={[
              styles.soilButton,
              {
                backgroundColor: isDark
                  ? APP_COLORS.brandPrimary
                  : APP_COLORS.brandPrimaryDark,
              },
            ] as unknown as ViewStyle}
          />
        </View>
      </View>
    );
  }

  // ✅ existing blue / cream logic (untouched)
  const isBlue = variant === "blue";

  return (
    <View style={[styles.card, { backgroundColor: palette.bg }, style]}>
      <AppImage
        source={image}
        resizeMode="cover"
        style={[styles.bgImage, isBlue ? styles.blueImage : styles.creamImage]}
      />

      <View
        style={[
          styles.content,
          isBlue ? styles.blueContent : styles.creamContent,
        ]}
      >
        <AppText
          variant="title24"
          color={palette.title}
          style={isBlue ? styles.title : styles.titleCream}
        >
          {title}
        </AppText>

        <AppText
          variant="body14"
          color={palette.sub}
          style={isBlue ? styles.subtitle : styles.subtitleCream}
        >
          {subtitle}
        </AppText>

        <AppButton
          title={buttonText}
          size="small"
          variant="primary"
          onPress={() => onPress}
          style={isBlue ? styles.cta : styles.ctaCream}
        />
      </View>
    </View>
  );
};

export default AppPromoCard;

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.md, // Radius.card equivalent
    padding: 24, // Space.lg equivalent
    marginBottom: 24, // Space.lg equivalent
    overflow: "hidden",
    minHeight: 140,
    justifyContent: "center",
  },

  // foreground text content
  content: { zIndex: 2 },
  blueContent: { alignItems: "flex-start" },
  creamContent: { alignItems: "flex-start", justifyContent: "center", flex: 1 },

  title: { fontFamily: FONTS.bold, marginBottom: 4 },
  titleCream: {
    fontFamily: FONTS.bold,
    marginBottom: 4,
    alignSelf: "center",
    textAlign: "center",
  },
  subtitle: { marginBottom: 8 }, // Space.sm equivalent
  subtitleCream: { marginBottom: 8, alignSelf: "center", textAlign: "center" },
  cta: { alignSelf: "flex-start" },
  ctaCream: { alignSelf: "center" },

  // background image (below text)
  bgImage: { position: "absolute", bottom: 0, right: 0, zIndex: 1 },
  blueImage: { width: 180, height: 130 },
  creamImage: { width: "100%", height: "100%", opacity: 0.95 },

  // ✅ soil styles (new)
  soilImage: {
    ...StyleSheet.absoluteFillObject,
    top: -20,
    right: 0,
    height: 180,
    width: "100%",
  },
  soilContent: {
    position: "absolute",
    top: "50%",
    left: 24,
    transform: [{ translateY: -40 }],
    zIndex: 3,
    gap: 8,
  },
  soilHeadingRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  soilTimerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  timerBox: {
    backgroundColor: APP_COLORS.errorLightBg,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  soilButton: {
    alignSelf: "flex-start",
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 8,
  },
});
