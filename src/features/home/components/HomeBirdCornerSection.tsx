import { AppImage, AppImageBackground } from "@/components/AppImage";
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
import { APP_COLORS } from "../../../../theme/colors";
import { Radius } from "../../../design";

const CARD_BORDER = "rgba(17, 17, 17, 0.05)";
const CARD_BG = "#F5EBEB";

type CornerCardProps = {
  title: string;
  description: string;
  background: ImageSourcePropType;
  onPress: () => void;
  textPrimary: string;
  textSecondary: string;
  illustration?: ImageSourcePropType;
  backgroundColor: string;
  borderColor: string;
};

const CornerCard: React.FC<CornerCardProps> = ({
  title,
  description,
  background,
  onPress,
  textPrimary,
  textSecondary,
  illustration,
  backgroundColor,
  borderColor,
}) => (
  <TouchableOpacity
    activeOpacity={0.85}
    onPress={onPress}
    style={styles.cornerCardWrap}
  >
    <AppImageBackground
      source={background}
      style={[styles.cornerCard, { borderColor, backgroundColor }]}
      imageStyle={styles.cornerCardImage}
      resizeMode="cover"
    >
      {illustration && (
        <AppImage
          source={illustration}
          style={{
            position: "absolute",
            top: 8,
            left: 12,
            width: 60,
            height: 40,
          }}
          resizeMode="contain"
        />
      )}
      <View style={styles.cardCopy}>
        <AppText
          allowFontScaling={false}
          variant="body14"
          style={[styles.cardTitle, { color: textPrimary }]}
          numberOfLines={2}
        >
          {title}
        </AppText>
        <AppText
          allowFontScaling={false}
          variant="caption12"
          style={{ color: textSecondary, lineHeight: 16 }}
          numberOfLines={2}
        >
          {description}
        </AppText>
      </View>
    </AppImageBackground>
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
  const theme = useTheme();
  const isDark = theme.mode === "dark";
  const backgroundColor = isDark ? APP_COLORS.homeCardDark : CARD_BG;
  const borderColor = isDark ? APP_COLORS.homeBorderDark : CARD_BORDER;
  const corner = strings.home.banners.yourBirdCorner;
  const textPrimary = theme.colors.textPrimary;
  const textSecondary = theme.colors.textSecondary;

  return (
    <View style={styles.section}>
      <AppText
        allowFontScaling={false}
        variant="body16"
        style={[
          styles.sectionTitle,
          { fontFamily: FONTS.bold, color: textPrimary },
        ]}
      >
        {corner.title}
      </AppText>

      <View style={styles.topRow}>
        <CornerCard
          title={corner.birdOfTheDay}
          description={corner.birdOfTheDayDescription}
          background={
            isDark ? Images.homeBirdOfDayCardDark : Images.homeBirdOfDayCard
          }
          onPress={onBirdOfTheDay}
          textPrimary={textPrimary}
          textSecondary={textSecondary}
          backgroundColor={backgroundColor}
          borderColor={borderColor}
        />
        <CornerCard
          title={corner.askAi.title}
          description={corner.askAi.description}
          background={
            isDark ? Images.homeAskAiCardDark : Images.homeAskAiCardIcon
          }
          onPress={onAskAi}
          textPrimary={textPrimary}
          textSecondary={textSecondary}
          backgroundColor={backgroundColor}
          borderColor={borderColor}
        />
      </View>

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onBirdSoundLibrary}
        style={styles.libraryRowWrap}
      >
        <AppImageBackground
          source={
            isDark
              ? Images.homeBirdSoundLibraryDark
              : Images.homeBirdSoundLibrary
          }
          style={[
            styles.libraryRow,
            { borderColor, backgroundColor },
            isDark && styles.libraryRowDark,
          ]}
          imageStyle={styles.libraryRowImage}
          resizeMode="stretch"
        >
          <View style={styles.libraryCopy}>
            <AppText
              allowFontScaling={false}
              variant="body14"
              style={[styles.cardTitle, { color: textPrimary }]}
            >
              {corner.birdSoundLibrary.title}
            </AppText>
            <AppText
              allowFontScaling={false}
              variant="caption12"
              style={{ color: textSecondary, lineHeight: 16 }}
            >
              {corner.birdSoundLibrary.description}
            </AppText>
          </View>
          <MaterialIcons name="chevron-right" size={20} color={textPrimary} />
        </AppImageBackground>
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
    height: 136,
  },
  cornerCardWrap: {
    flex: 1,
  },
  cornerCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: 12,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  cornerCardImage: {
    borderRadius: Radius.md,
  },
  cardCopy: {
    gap: 4,
  },
  cardTitle: {
    fontFamily: FONTS.bold,
    lineHeight: 20,
  },
  libraryRowWrap: {
    width: "100%",
  },
  libraryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    height: 72,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingVertical: 8,
    paddingLeft: 56,
    paddingRight: 16,
    overflow: "hidden",
  },
  /**
   * Figma 9375:212475 dark: pl 12 + 36pt icon + 12 gap → copy at 60pt; py 8,
   * height hugs the two-line description (min 72).
   */
  libraryRowDark: {
    height: undefined,
    minHeight: 72,
    paddingLeft: 60,
  },
  libraryRowImage: {
    borderRadius: Radius.md,
    resizeMode: "stretch",
  },
  libraryCopy: {
    flex: 1,
    gap: 4,
  },
});

/** @deprecated Use HomeBirdCornerSection */
export const HomeMushroomCornerSection = HomeBirdCornerSection;
