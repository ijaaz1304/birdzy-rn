import { useWindowDimensions } from "react-native";
import { getResponsiveGridColumns } from "@/utils/responsiveLayout";
import { AppImage } from "@/components/AppImage";
import React from "react";
import {
  ImageSourcePropType,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { AppText } from "../../../components/shared";
import { Images } from "../../../assets";
import { FONTS } from "../../../common/typography";
import { useStrings } from "../../../hooks/useStrings";
import { useTheme } from "../../../hooks/useTheme";
import { Radius } from "../../../design";

const CARD_BORDER = "rgba(17, 17, 17, 0.05)";
/** Flat fill of the Figma card art (#EBE5EE) — icons/decorations are separate images on top. */
const CARD_BG = "#EBE5EE";

type Deco = { source: ImageSourcePropType; width: number; height: number };

type CornerCardProps = {
  title: string;
  description: string;
  icon: ImageSourcePropType;
  deco: Deco;
  onPress: () => void;
  textPrimary: string;
  textSecondary: string;
  testID?: string;
};

/**
 * Figma 8598:65527 / 8598:65539 — 36pt icon top-left, faded decoration in the bottom-right corner,
 * title (max 3 lines) + description (max 4 lines). The card is 136pt minimum and grows with its text
 * (the old single background image scaled/cropped its icons when the card stretched).
 */
const CornerCard: React.FC<CornerCardProps> = ({
  title,
  description,
  icon,
  deco,
  onPress,
  textPrimary,
  textSecondary,
  testID,
}) => (
  <TouchableOpacity
    testID={testID}
    activeOpacity={0.85}
    onPress={onPress}
    style={styles.cornerCardWrap}
    accessibilityRole="button"
  >
    <View
      style={[
        styles.cornerCard,
        { borderColor: CARD_BORDER, backgroundColor: CARD_BG },
      ]}
    >
      <AppImage
        source={deco.source}
        style={[styles.deco, { width: deco.width, height: deco.height }]}
        resizeMode="contain"
        pointerEvents="none"
      />
      <AppImage source={icon} style={styles.icon} resizeMode="contain" />
      <View style={styles.cardSpacer} />
      <View style={styles.cardCopy}>
        <AppText
          variant="body14"
          numberOfLines={3}
          style={[styles.cardTitle, { color: textPrimary }]}
        >
          {title}
        </AppText>
        <AppText
          variant="caption12"
          numberOfLines={4}
          style={[styles.cardDescription, { color: textSecondary }]}
        >
          {description}
        </AppText>
      </View>
    </View>
  </TouchableOpacity>
);

type Props = {
  onBirdOfTheDay: () => void;
  onAskAi: () => void;
  onBirdSoundLibrary: () => void;
  /** @deprecated Personality quiz — hidden from Figma home; kept for API compat */
  onFindMushroom?: () => void;
};

export const HomeBirdCornerSection: React.FC<Props> = ({
  onBirdOfTheDay,
  onAskAi,
  onBirdSoundLibrary,
}) => {
  const strings = useStrings();
  const { width: windowWidth, fontScale } = useWindowDimensions();
  const stacked = getResponsiveGridColumns(windowWidth, fontScale) === 1;
  const theme = useTheme();
  const corner = strings.home.banners.yourBirdCorner;
  const textPrimary = theme.colors.textPrimary;
  const textSecondary = theme.colors.textSecondary;

  return (
    <View style={styles.section}>
      <AppText
        variant="body16"
        style={[
          styles.sectionTitle,
          { fontFamily: FONTS.bold, color: textPrimary },
        ]}
      >
        {corner.title}
      </AppText>

      <View style={[styles.topRow, stacked && { flexDirection: "column" }]}>
        <CornerCard
          title={corner.birdOfTheDay}
          description={corner.birdOfTheDayDescription}
          icon={Images.homeCornerBotdIcon}
          deco={{ source: Images.homeCornerBotdDeco, width: 78.5, height: 75 }}
          testID="home-corner-bird-of-the-day"
          onPress={onBirdOfTheDay}
          textPrimary={textPrimary}
          textSecondary={textSecondary}
        />
        <CornerCard
          title={corner.askAi.title}
          description={corner.askAi.description}
          icon={Images.homeCornerAskAiIcon}
          deco={{ source: Images.homeCornerAskAiDeco, width: 65, height: 70 }}
          testID="home-corner-ask-ai"
          onPress={onAskAi}
          textPrimary={textPrimary}
          textSecondary={textSecondary}
        />
      </View>

      {/* Figma 8975:40017 — 72pt minimum row: icon, title + description, chevron; grows with text */}
      <TouchableOpacity
        testID="home-corner-sound-library"
        activeOpacity={0.85}
        onPress={onBirdSoundLibrary}
        style={styles.libraryRowWrap}
        accessibilityRole="button"
      >
        <View
          style={[
            styles.libraryRow,
            { borderColor: CARD_BORDER, backgroundColor: CARD_BG },
          ]}
        >
          <AppImage
            source={Images.homeCornerLibraryDeco}
            style={styles.libraryDeco}
            resizeMode="contain"
            pointerEvents="none"
          />
          <AppImage
            source={Images.homeCornerLibraryIcon}
            style={styles.icon}
            resizeMode="contain"
          />
          <View style={styles.libraryCopy}>
            <AppText
              variant="body14"
              numberOfLines={2}
              style={[styles.cardTitle, { color: textPrimary }]}
            >
              {corner.birdSoundLibrary.title}
            </AppText>
            <AppText
              variant="caption12"
              numberOfLines={4}
              style={[styles.cardDescription, { color: textSecondary }]}
            >
              {corner.birdSoundLibrary.description}
            </AppText>
          </View>
          <MaterialIcons name="chevron-right" size={20} color={textPrimary} />
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    width: "100%",
    gap: 16,
  },
  sectionTitle: {
    lineHeight: 24,
  },
  topRow: {
    flexDirection: "row",
    gap: 12,
  },
  cornerCardWrap: {
    flex: 1,
  },
  cornerCard: {
    flex: 1,
    minHeight: 136,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: 12,
    overflow: "hidden",
  },
  /** Figma decoration: pinned to the card's bottom-right corner, never scaled with the card */
  deco: {
    position: "absolute",
    right: 0,
    bottom: 0,
  },
  icon: {
    width: 36,
    height: 36,
  },
  /** Figma: copy starts 20pt below the icon; extra height pushes the copy to the bottom */
  cardSpacer: {
    flexGrow: 1,
    minHeight: 20,
  },
  cardCopy: {
    gap: 4,
  },
  cardTitle: {
    fontFamily: FONTS.bold,
    lineHeight: 20,
  },
  cardDescription: {
    lineHeight: 16,
  },
  libraryRowWrap: {
    width: "100%",
  },
  libraryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 72,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingVertical: 8,
    paddingLeft: 12,
    paddingRight: 16,
    overflow: "hidden",
  },
  libraryDeco: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 87,
    height: 57,
  },
  libraryCopy: {
    flex: 1,
    gap: 4,
  },
});

/** @deprecated Use HomeBirdCornerSection */
export const HomeMushroomCornerSection = HomeBirdCornerSection;
