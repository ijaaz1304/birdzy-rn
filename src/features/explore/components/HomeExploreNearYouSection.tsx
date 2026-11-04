import { AppImage } from "@/components/AppImage";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { AppText } from "../../../components/shared";
import {
  HomeExploreHotspotIcon as ExploreHotspotIcon,
  HomeExplorePinIcon as ExplorePinIcon,
  exploreImages,
} from "../assets";
import { EXPLORE_HOME_STRINGS } from "../content/explore.strings";
import { FONTS } from "../../../common/typography";
import { useTheme, useIsDark } from "../../../hooks/useTheme";
import { Radius } from "../../../design";

/** Figma 8230:72834 / 8230:72835 — map art only; copy is live text */
const EXPLORE_BANNER_BG = "#F5EBEB";
const EXPLORE_OUTER_BORDER = "#E7E7E7";
const EXPLORE_INNER_BORDER = "#E9EFD2";

const MAP_HOTSPOTS = [
  { left: 109, top: 36 },
  { left: 188, top: 96 },
  { left: 105, top: 132 },
  { left: 39, top: 111 },
] as const;

type Props = {
  onExploreMap: () => void;
  onGrowingNow: () => void;
  onYearRound: () => void;
};

export const HomeExploreNearYouSection: React.FC<Props> = ({
  onExploreMap,
  onGrowingNow,
  onYearRound,
}) => {
  const theme = useTheme();
  const isDark = useIsDark();
  const strings = EXPLORE_HOME_STRINGS;
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surfacePrimary,
          borderColor: EXPLORE_OUTER_BORDER,
        },
      ]}
    >
      <View
        style={[
          styles.banner,
          {
            backgroundColor: isDark
              ? theme.colors.surfaceSecondary
              : EXPLORE_BANNER_BG,
            borderColor: isDark ? theme.colors.border0 : EXPLORE_INNER_BORDER,
          },
        ]}
      >
        <View style={styles.mapArt} pointerEvents="none">
          <AppImage
            source={exploreImages.homeMap}
            style={[styles.mapImage, isDark && styles.dimMapImage]}
            resizeMode="contain"
          />
          {MAP_HOTSPOTS.map((spot) => (
            <View
              key={`${spot.left}-${spot.top}`}
              style={[styles.hotspot, { left: spot.left, top: spot.top }]}
            >
              <ExploreHotspotIcon width={12} height={12} />
            </View>
          ))}
          <View style={styles.pin}>
            <ExplorePinIcon width={24} height={24} />
          </View>
        </View>
        <View style={styles.bannerCopy}>
          <AppText
            variant="title18"
            style={[styles.bannerTitle, { color: theme.colors.textPrimary }]}
          >
            {strings.title}
          </AppText>
          <AppText variant="caption12" color="textSecondary">
            {strings.description}
          </AppText>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onExploreMap}
            style={[
              styles.mapButton,
              {
                backgroundColor: theme.colors.surfacePrimary,
                borderColor: EXPLORE_OUTER_BORDER,
              },
            ]}
          >
            <AppText variant="body14" style={{ fontFamily: FONTS.medium }}>
              {strings.exploreMap}
            </AppText>
          </TouchableOpacity>
        </View>
      </View>

      <ExploreRow
        label={strings.growingNow}
        onPress={onGrowingNow}
        textColor={theme.colors.textPrimary}
      />
      <ExploreRow
        label={strings.yearRound}
        onPress={onYearRound}
        textColor={theme.colors.textPrimary}
      />
    </View>
  );
};

function ExploreRow({
  label,
  onPress,
  textColor,
}: {
  label: string;
  onPress: () => void;
  textColor: string;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      style={styles.row}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <AppText
        variant="body14"
        style={{ fontFamily: FONTS.bold, color: textColor }}
      >
        {label}
      </AppText>
      <MaterialIcons name="chevron-right" size={24} color={textColor} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: 8,
    gap: 8,
  },
  banner: {
    height: 172,
    borderRadius: Radius.md,
    borderWidth: 1,
    overflow: "hidden",
    position: "relative",
  },
  mapArt: {
    position: "absolute",
    left: 128,
    top: 4,
    width: 264,
    height: 194,
  },
  dimMapImage: { opacity: 0.45 },
  mapImage: {
    width: "100%",
    height: "100%",
  },
  hotspot: {
    position: "absolute",
    width: 12,
    height: 12,
  },
  pin: {
    position: "absolute",
    left: 146,
    top: 41,
    width: 24,
    height: 24,
  },
  bannerCopy: {
    position: "absolute",
    left: 15,
    top: "50%",
    transform: [{ translateY: -52 }],
    width: 158,
    gap: 16,
    zIndex: 1,
  },
  bannerTitle: {
    fontFamily: FONTS.bold,
    lineHeight: 24,
  },
  mapButton: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: Radius.xl,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
});
