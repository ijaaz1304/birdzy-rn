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
/** Figma text-icon-primary (light) */
const EXPLORE_TITLE_COLOR_LIGHT = "#091B21";
const CARD_PADDING = 8;
const CARD_BORDER_WIDTH = 1;
const SIDE_MARGIN = 20;
const STANDALONE_MAP_OVERHANG = 45;

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

/**
 * Left and top edge of the map shape, in map-box units, traced from the
 * transparent edge of the home map art. Brand stroke is drawn over the grey.
 * Coordinates match EXPLORE_DESIGN.map (236×173).
 */
const MAP_OUTLINE_POINTS =
  "63.2,172.5 1.0,134.5 32.9,95.8 33.4,63.4 49.3,29.2 94.1,8.9 157.8,16.9 205.1,0.5";

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
  const { width: windowWidth, fontScale } = useWindowDimensions();
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

  const buttonLabel = locationGranted
    ? strings.exploreMap
    : strings.enableLocation;
  const mapLeft = panelOnly
    ? panelWidth - (sc(EXPLORE_DESIGN.map.width) - STANDALONE_MAP_OVERHANG)
    : sc(EXPLORE_DESIGN.map.left);
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
        onLayout={(e) => {
          onPanelLayout(e);
          const w = Math.round(e.nativeEvent.layout.width);
          if (w > 0 && w !== bannerWidth) setBannerWidth(w);
        }}
        style={[
          styles.banner,
          panelOnly && { borderRadius: 0 },
          {
            minHeight: sc(EXPLORE_DESIGN.bannerHeight),
            backgroundColor: isDark
              ? theme.colors.surfaceSecondary
              : EXPLORE_BANNER_BG,
            borderColor: isDark ? theme.colors.border0 : EXPLORE_INNER_BORDER,
          },
        ]}
      >
        <View
          style={[
            styles.mapArt,
            fontScale > 1.2 && { opacity: 0 },
            {
              left: mapLeft,
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
          <Svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${EXPLORE_DESIGN.map.width} ${EXPLORE_DESIGN.map.height}`}
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
               * Keep default artwork proportions; enlarged text gets the full copy width.
               */
              width:
                fontScale > 1.2
                  ? Math.max(1, bannerWidth - 32)
                  : Math.max(
                      EXPLORE_DESIGN.copy.width,
                      sc(EXPLORE_DESIGN.copy.width)
                    ),
            },
          ]}
          pointerEvents="none"
        >
          <View style={styles.bannerTextGroup}>
            <AppText
              variant="title18"
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
            <AppText
              variant="caption12"
              color="textSecondary"
              style={styles.bannerDescription}
            >
              {strings.description}
            </AppText>
          </View>
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
    position: "relative",
    paddingVertical: 16,
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
