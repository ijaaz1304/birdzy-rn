import { AppImage } from "@/components/AppImage";
import React, { useEffect, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { AppText } from "../../../components/shared";
import { Images } from "../../../assets";
import { HOME_STRINGS } from "../../../config/strings/home.strings";
import { FONTS } from "../../../common/typography";
import { useTheme } from "../../../hooks/useTheme";
import { Radius } from "../../../design";
import { archetypeService } from "../../../services/archetype/archetype.service";
import { CATEGORIES } from "../../../constants/appConstants";

const EXPLORE_BANNER_BG = "#F5EBEB";
const CARD_BORDER = "#E9EFD2";

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
          borderColor: theme.colors.border,
        },
      ]}
    >
      <View style={[styles.banner, { backgroundColor: EXPLORE_BANNER_BG, borderColor: CARD_BORDER }]}>
        <AppImage
          source={Images.homeExploreNearYouMap}
          style={styles.mapArt}
          resizeMode="contain"
        />
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
                borderColor: theme.colors.border,
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
    height: 154,
    borderRadius: Radius.md,
    borderWidth: 1,
    overflow: "hidden",
    position: "relative",
  },
  mapArt: {
    position: "absolute",
    right: -24,
    top: 8,
    width: 236,
    height: 173,
  },
  bannerCopy: {
    position: "absolute",
    left: 15,
    top: "50%",
    transform: [{ translateY: -52 }],
    width: 158,
    gap: 16,
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
