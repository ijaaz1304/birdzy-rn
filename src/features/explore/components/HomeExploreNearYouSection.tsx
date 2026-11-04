import { AppImage } from "@/components/AppImage";
import React, { useState } from "react";
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
/** Figma text-icon-primary (light) */
const EXPLORE_TITLE_COLOR_LIGHT = "#091B21";

/**
 * Figma 8230:72835 "banner - Op2" at a 375pt screen (banner 319×154).
 * Everything below is scaled by (measured banner width / 319).
 */
const EXPLORE_DESIGN = {
  bannerWidth: 319,
  bannerHeight: 154,
  /** Map art 236×173 at (141, 8); overflows right/bottom and is clipped */
  map: { left: 141, top: 8, width: 236, height: 173 },
  /** Pin 24×24 at (130, 37) inside the map art */
  pin: { left: 130, top: 37, size: 24 },
  hotspotSize: 12,
  /** Copy block 158 wide, 15 from the left */
  copy: { left: 15, width: 158 },
} as const;
const EXPLORE_MIN_SCALE = 0.85;
const EXPLORE_MAX_SCALE = 1.3;

/** Figma 8230:72836 — hotspot positions inside the 236×173 map art */
const MAP_HOTSPOTS = [
  { left: 96.79, top: 32 },
  { left: 168, top: 86 },
  { left: 94, top: 118 },
  { left: 35, top: 99 },
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

  /**
   * Responsive: scale the banner (height, map art, hotspots, pin, copy box)
   * with its measured width relative to Figma's 319pt banner. Font sizes stay
   * at Figma values. Clamped so tiny/huge widths stay sensible.
   */
  const [bannerWidth, setBannerWidth] = useState<number>(
    EXPLORE_DESIGN.bannerWidth
  );
  const bannerScale = Math.min(
    EXPLORE_MAX_SCALE,
    Math.max(EXPLORE_MIN_SCALE, bannerWidth / EXPLORE_DESIGN.bannerWidth)
  );
  const sc = (value: number) => Math.round(value * bannerScale * 10) / 10;

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
            height: sc(EXPLORE_DESIGN.bannerHeight),
            backgroundColor: isDark
              ? theme.colors.surfaceSecondary
              : EXPLORE_BANNER_BG,
            borderColor: isDark ? theme.colors.border0 : EXPLORE_INNER_BORDER,
          },
        ]}
        onLayout={(e) => {
          const w = Math.round(e.nativeEvent.layout.width);
          if (w > 0 && w !== bannerWidth) setBannerWidth(w);
        }}
      >
        <View
          style={[
            styles.mapArt,
            {
              left: sc(EXPLORE_DESIGN.map.left),
              top: sc(EXPLORE_DESIGN.map.top),
              width: sc(EXPLORE_DESIGN.map.width),
              height: sc(EXPLORE_DESIGN.map.height),
            },
          ]}
          pointerEvents="none"
        >
          <AppImage
            source={exploreImages.homeMap}
            style={[styles.mapImage, isDark && styles.dimMapImage]}
            resizeMode="contain"
          />
          {MAP_HOTSPOTS.map((spot) => (
            <View
              key={`${spot.left}-${spot.top}`}
              style={[
                styles.hotspot,
                {
                  left: sc(spot.left),
                  top: sc(spot.top),
                  width: sc(EXPLORE_DESIGN.hotspotSize),
                  height: sc(EXPLORE_DESIGN.hotspotSize),
                },
              ]}
            >
              <ExploreHotspotIcon
                width={sc(EXPLORE_DESIGN.hotspotSize)}
                height={sc(EXPLORE_DESIGN.hotspotSize)}
              />
            </View>
          ))}
          <View
            style={[
              styles.pin,
              {
                left: sc(EXPLORE_DESIGN.pin.left),
                top: sc(EXPLORE_DESIGN.pin.top),
                width: sc(EXPLORE_DESIGN.pin.size),
                height: sc(EXPLORE_DESIGN.pin.size),
              },
            ]}
          >
            <ExplorePinIcon
              width={sc(EXPLORE_DESIGN.pin.size)}
              height={sc(EXPLORE_DESIGN.pin.size)}
            />
          </View>
        </View>
        <View
          style={[
            styles.bannerCopy,
            {
              left: sc(EXPLORE_DESIGN.copy.left),
              /**
               * Fonts don't scale, so the copy box must never shrink below
               * Figma's 158pt or the title/button wrap on small phones.
               */
              width: Math.max(
                EXPLORE_DESIGN.copy.width,
                sc(EXPLORE_DESIGN.copy.width)
              ),
            },
          ]}
        >
          {/* Figma: title + subtitle stacked with a 2pt gap; 16pt before the button */}
          <View style={styles.bannerTextGroup}>
            {/* Figma Title/18px/Bold — 18/24, 700, text-icon-primary */}
            <AppText
              variant="title18"
              allowFontScaling={false}
              style={[
                styles.bannerTitle,
                {
                  color: isDark
                    ? theme.colors.textPrimary
                    : EXPLORE_TITLE_COLOR_LIGHT,
                },
              ]}
            >
              {strings.title}
            </AppText>
            {/* Figma Caption/12px/Regular — #5D5D5D, 12/16, ligatures off, 158 wide */}
            <AppText
              variant="caption12"
              color="textSecondary"
              allowFontScaling={false}
              style={styles.bannerDescription}
            >
              {strings.description}
            </AppText>
          </View>
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
            <AppText
              allowFontScaling={false}
              variant="body14"
              numberOfLines={1}
              style={{ fontFamily: FONTS.medium }}
            >
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
      <AppText allowFontScaling={false}
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
  /** Height is set at render: EXPLORE_DESIGN.bannerHeight × scale */
  banner: {
    borderRadius: Radius.md,
    borderWidth: 1,
    overflow: "hidden",
    position: "relative",
  },
  /** Position/size set at render from EXPLORE_DESIGN.map × scale */
  mapArt: {
    position: "absolute",
  },
  dimMapImage: { opacity: 0.45 },
  mapImage: {
    width: "100%",
    height: "100%",
  },
  hotspot: {
    position: "absolute",
  },
  /** Position/size set at render from EXPLORE_DESIGN.pin × scale */
  pin: {
    position: "absolute",
  },
  /** Figma: copy block vertically centered; left/width set at render (15 / 158 × scale) */
  bannerCopy: {
    position: "absolute",
    top: 0,
    bottom: 0,
    justifyContent: "center",
    gap: 16,
    zIndex: 1,
  },
  bannerTextGroup: {
    width: "100%",
    gap: 2,
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
    fontStyle: "normal",
    fontSize: 18,
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
