import { AppImageBackground } from "@/components/AppImage";
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
const CARD_BG = "#F5EBEB";

type CornerCardProps = {
  title: string;
  description: string;
  background: ImageSourcePropType;
  onPress: () => void;
  textPrimary: string;
  textSecondary: string;
};

const CornerCard: React.FC<CornerCardProps> = ({
  title,
  description,
  background,
  onPress,
  textPrimary,
  textSecondary,
}) => (
  <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={styles.cornerCardWrap}>
    <AppImageBackground
      source={background}
      style={[styles.cornerCard, { borderColor: CARD_BORDER, backgroundColor: CARD_BG }]}
      imageStyle={styles.cornerCardImage}
      resizeMode="cover"
    >
      <View style={styles.cardCopy}>
        <AppText allowFontScaling={false}
          variant="body14"
          style={[styles.cardTitle, { color: textPrimary }]}
          numberOfLines={2}
        >
          {title}
        </AppText>
        <AppText allowFontScaling={false}
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
  const corner = strings.home.banners.yourBirdCorner;
  const textPrimary = theme.colors.textPrimary;
  const textSecondary = theme.colors.textSecondary;

  return (
    <View style={styles.section}>
      <AppText allowFontScaling={false}
        variant="body16"
        style={[styles.sectionTitle, { fontFamily: FONTS.bold, color: textPrimary }]}
      >
        {corner.title}
      </AppText>

      <View style={styles.topRow}>
        <CornerCard
          title={corner.birdOfTheDay}
          description={corner.birdOfTheDayDescription}
          background={Images.homeBirdOfDayCard}
          onPress={onBirdOfTheDay}
          textPrimary={textPrimary}
          textSecondary={textSecondary}
        />
        <CornerCard
          title={corner.askAi.title}
          description={corner.askAi.description}
          background={Images.homeAskAiCardIcon}
          onPress={onAskAi}
          textPrimary={textPrimary}
          textSecondary={textSecondary}
        />
      </View>

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onBirdSoundLibrary}
        style={styles.libraryRowWrap}
      >
        <AppImageBackground
          source={Images.homeBirdSoundLibrary}
          style={[styles.libraryRow, { borderColor: CARD_BORDER, backgroundColor: CARD_BG }]}
          imageStyle={styles.libraryRowImage}
          resizeMode="stretch"
        >
          <View style={styles.libraryCopy}>
            <AppText allowFontScaling={false}
              variant="body14"
              style={[styles.cardTitle, { color: textPrimary }]}
            >
              {corner.birdSoundLibrary.title}
            </AppText>
            <AppText allowFontScaling={false} variant="caption12" style={{ color: textSecondary, lineHeight: 16 }}>
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
