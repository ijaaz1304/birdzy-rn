import { AppImage } from "@/components/AppImage";
import React, { useEffect, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { AppText } from "../../../components/shared";
import { ExploreHotspotIcon, ExplorePinIcon, Images } from "../../../assets";
import { HOME_STRINGS } from "../../../config/strings/home.strings";
import { FONTS } from "../../../common/typography";
import { useTheme } from "../../../hooks/useTheme";
import { Radius } from "../../../design";
import { archetypeService } from "../../../services/archetype/archetype.service";
import { CATEGORIES } from "../../../constants/appConstants";

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
  const strings = HOME_STRINGS.discovery.exploreNearYou;
  const [growingCount, setGrowingCount] = useState<number | null>(null);
  const [yearRoundCount, setYearRoundCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    void archetypeService
      .getArchetypeStats()
      .then((stats) => {
        if (cancelled) return;
        setYearRoundCount(stats.all ?? null);
        setGrowingCount(stats.songbirds ?? stats.all ?? null);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const formatRow = (label: string, count: number | null) =>
    count != null ? `${label} (${count.toLocaleString()})` : label;

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
            backgroundColor: EXPLORE_BANNER_BG,
            borderColor: EXPLORE_INNER_BORDER,
          },
        ]}
      >
        <View style={styles.mapArt} pointerEvents="none">
          <AppImage
            source={Images.homeExploreNearYouMap}
            style={styles.mapImage}
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
          {/* Figma Caption/12px/Regular — #5D5D5D, 12/16, ligatures off, 158 wide */}
          <AppText
            variant="caption12"
            color={theme.colors.textSecondary}
            allowFontScaling={false}
            style={styles.bannerDescription}
          >
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
        label={formatRow(strings.growingNow, growingCount)}
        onPress={onGrowingNow}
        textColor={theme.colors.textPrimary}
      />
      <ExploreRow
        label={formatRow(strings.yearRound, yearRoundCount)}
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
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
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
  /** Figma Caption/12px/Regular: Satoshi Regular 400, 12/16, 'liga' off, 'clig' off */
  bannerDescription: {
    fontFamily: FONTS.regular,
    fontStyle: "normal",
    fontSize: 12,
    lineHeight: 16,
    fontVariant: ["no-common-ligatures"],
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

/** Default catalogue category keys for explore rows. */
export const EXPLORE_NEAR_YOU_CATEGORIES = {
  map: CATEGORIES.NEAR_YOU,
  growing: CATEGORIES.SONGBIRDS,
  yearRound: CATEGORIES.ALL,
} as const;
