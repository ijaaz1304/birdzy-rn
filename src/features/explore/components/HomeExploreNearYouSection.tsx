import { AppImage } from "@/components/AppImage";
import React, { useState } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import Svg, { Polyline } from "react-native-svg";
import { AppText } from "../../../components/shared";
import {
  HomeExploreHotspotIcon as ExploreHotspotIcon,
  HomeExplorePinIcon as ExplorePinIcon,
  exploreImages,
} from "../assets";
import { EXPLORE_HOME_STRINGS } from "../content/explore.strings";
import { EXPLORE_COLORS } from "../content/explore.colors";
import { FONTS } from "../../../common/typography";
import { useTheme, useIsDark } from "../../../hooks/useTheme";
import { Radius } from "../../../design";

/** Figma 8230:72834 / 8230:72835 — map art only; copy is live text */
const EXPLORE_BANNER_BG = "#F5EBEB";
const EXPLORE_OUTER_BORDER = "#E7E7E7";
const EXPLORE_INNER_BORDER = "#E9EFD2";
const CARD_PADDING = 8;
const CARD_BORDER_WIDTH = 1;
const SIDE_MARGIN = 20;
const STANDALONE_MAP_OVERHANG = 45;
const MAP = { left: 128, top: 4, width: 264, height: 194 };
/**
 * Left and top edge of the map shape, in map-box units, traced from the
 * transparent edge of the home map art. Brand stroke is drawn over the grey.
 */
const MAP_OUTLINE_POINTS =
  "70.6,192.5 1.1,150.5 36.7,107.3 37.3,71.1 55.1,32.7 105.1,10 176.3,18.9 229.1,0.6";

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
  /**
   * False while location access is off: the button reads "Enable Location".
   * True or undefined keeps "Explore Map".
   */
  locationGranted?: boolean;
  /** False shows the map panel alone, without Spotted Now / Year-round rows (Catalogue). */
  showRows?: boolean;
  /** Space left and right of the card, used to size the map before first layout. */
  sideMargin?: number;
};

export const HomeExploreNearYouSection: React.FC<Props> = ({
  onExploreMap,
  onGrowingNow,
  onYearRound,
  locationGranted = true,
  showRows = true,
  sideMargin = SIDE_MARGIN,
}) => {
  const theme = useTheme();
  const isDark = useIsDark();
  const strings = EXPLORE_HOME_STRINGS;
  const { width: windowWidth } = useWindowDimensions();
  const panelOnly = !showRows;
  const cardPadding = panelOnly ? 0 : CARD_PADDING;
  const [panelWidth, setPanelWidth] = useState(
    Math.max(
      windowWidth - sideMargin * 2 - cardPadding * 2 - CARD_BORDER_WIDTH * 2,
      0
    )
  );
  const onPanelLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (Math.abs(w - panelWidth) >= 1) setPanelWidth(w);
  };
  const buttonLabel = locationGranted
    ? strings.exploreMap
    : strings.enableLocation;
  const mapLeft = panelOnly
    ? panelWidth - (MAP.width - STANDALONE_MAP_OVERHANG)
    : MAP.left;
  const outline = isDark
    ? EXPLORE_COLORS.mapOutlineDark
    : EXPLORE_COLORS.mapOutlineLight;
  const panelBorder = isDark
    ? EXPLORE_COLORS.panelBorderDark
    : EXPLORE_COLORS.panelBorderLight;

  return (
    <View
      style={[
        styles.container,
        panelOnly
          ? {
              padding: 0,
              gap: 0,
              backgroundColor: "transparent",
              borderColor: panelBorder,
            }
          : {
              backgroundColor: theme.colors.surfacePrimary,
              borderColor: EXPLORE_OUTER_BORDER,
            },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onExploreMap}
        accessibilityRole="button"
        accessibilityLabel={buttonLabel}
        onLayout={onPanelLayout}
        style={[
          styles.banner,
          panelOnly && { borderRadius: 0 },
          {
            backgroundColor: isDark
              ? theme.colors.surfaceSecondary
              : EXPLORE_BANNER_BG,
            borderColor: isDark ? theme.colors.border0 : EXPLORE_INNER_BORDER,
          },
        ]}
      >
        <View
          style={[styles.mapArt, { left: mapLeft }]}
          pointerEvents="none"
        >
          <AppImage
            source={exploreImages.homeMap}
            style={[styles.mapImage, isDark && styles.dimMapImage]}
            resizeMode="contain"
          />
          <Svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${MAP.width} ${MAP.height}`}
            preserveAspectRatio="none"
            style={StyleSheet.absoluteFill}
          >
            <Polyline
              points={MAP_OUTLINE_POINTS}
              fill="none"
              stroke={outline}
              strokeWidth={1.5}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </Svg>
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
        <View style={styles.bannerCopy} pointerEvents="none">
          <AppText
            variant="title18"
            style={[styles.bannerTitle, { color: theme.colors.textPrimary }]}
          >
            {strings.title}
          </AppText>
          <AppText variant="caption12" color="textSecondary">
            {strings.description}
          </AppText>
          <View
            importantForAccessibility="no-hide-descendants"
            accessibilityElementsHidden
            style={[
              styles.mapButton,
              {
                backgroundColor: theme.colors.surfacePrimary,
                borderColor: EXPLORE_OUTER_BORDER,
              },
            ]}
          >
            <AppText variant="body14" style={{ fontFamily: FONTS.medium }}>
              {buttonLabel}
            </AppText>
          </View>
        </View>
      </TouchableOpacity>

      {showRows ? (
        <>
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
        </>
      ) : null}
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
    borderWidth: CARD_BORDER_WIDTH,
    borderRadius: Radius.lg,
    padding: CARD_PADDING,
    gap: 8,
    overflow: "hidden",
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
    top: MAP.top,
    width: MAP.width,
    height: MAP.height,
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
