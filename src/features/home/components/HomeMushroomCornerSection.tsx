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

const CARD_BG = "#F5EBEB";
const CARD_BORDER = "rgba(17, 17, 17, 0.05)";

type CornerCardProps = {
  title: string;
  description: string;
  icon: ImageSourcePropType;
  watermark?: ImageSourcePropType;
  onPress: () => void;
  textPrimary: string;
  textSecondary: string;
};

const CornerCard: React.FC<CornerCardProps> = ({
  title,
  description,
  icon,
  watermark,
  onPress,
  textPrimary,
  textSecondary,
}) => (
  <TouchableOpacity
    activeOpacity={0.85}
    onPress={onPress}
    style={[styles.cornerCard, { backgroundColor: CARD_BG, borderColor: CARD_BORDER }]}
  >
    {watermark ? (
      <AppImage source={watermark} style={styles.watermark} resizeMode="contain" />
    ) : null}
    <AppImage source={icon} style={styles.cardIcon} resizeMode="contain" />
    <View style={styles.cardCopy}>
      <AppText
        variant="body14"
        style={[styles.cardTitle, { color: textPrimary }]}
        numberOfLines={2}
      >
        {title}
      </AppText>
      <AppText
        variant="caption12"
        style={{ color: textSecondary, lineHeight: 16 }}
        numberOfLines={2}
      >
        {description}
      </AppText>
    </View>
  </TouchableOpacity>
);

type Props = {
  onMushroomOfTheDay: () => void;
  onAskAi: () => void;
  onBirdSoundLibrary: () => void;
  /** @deprecated Personality quiz — hidden from Figma home; kept for API compat */
  onFindMushroom?: () => void;
};

export const HomeMushroomCornerSection: React.FC<Props> = ({
  onMushroomOfTheDay,
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
      <AppText
        variant="body16"
        style={[styles.sectionTitle, { fontFamily: FONTS.bold, color: textPrimary }]}
      >
        {corner.title}
      </AppText>

      <View style={styles.topRow}>
        <CornerCard
          title={corner.birdOfTheDay}
          description={corner.birdOfTheDayDescription}
          icon={Images.homeBirdOfDayCard}
          watermark={Images.homeBirdOfDayCard}
          onPress={onMushroomOfTheDay}
          textPrimary={textPrimary}
          textSecondary={textSecondary}
        />
        <CornerCard
          title={corner.askAi.title}
          description={corner.askAi.description}
          icon={Images.homeAskAiCardIcon}
          watermark={Images.homeAskAiCardIcon}
          onPress={onAskAi}
          textPrimary={textPrimary}
          textSecondary={textSecondary}
        />
      </View>

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onBirdSoundLibrary}
        style={[styles.libraryRow, { backgroundColor: CARD_BG, borderColor: CARD_BORDER }]}
      >
        <AppImage
          source={Images.homeBirdSoundLibrary}
          style={styles.libraryIcon}
          resizeMode="contain"
        />
        <View style={styles.libraryCopy}>
          <AppText
            variant="body14"
            style={[styles.cardTitle, { color: textPrimary }]}
          >
            {corner.birdSoundLibrary.title}
          </AppText>
          <AppText variant="caption12" style={{ color: textSecondary, lineHeight: 16 }}>
            {corner.birdSoundLibrary.description}
          </AppText>
        </View>
        <MaterialIcons name="chevron-right" size={20} color={textPrimary} />
        <AppImage
          source={Images.homeBirdSoundLibrary}
          style={styles.libraryWatermark}
          resizeMode="contain"
        />
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
  cornerCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: 12,
    overflow: "hidden",
    justifyContent: "space-between",
  },
  watermark: {
    position: "absolute",
    right: -1,
    bottom: -5,
    width: 80,
    height: 80,
    opacity: 0.05,
  },
  cardIcon: {
    width: 36,
    height: 36,
  },
  cardCopy: {
    gap: 4,
  },
  cardTitle: {
    fontFamily: FONTS.bold,
    lineHeight: 20,
  },
  libraryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingVertical: 8,
    paddingLeft: 12,
    paddingRight: 16,
    overflow: "hidden",
    minHeight: 72,
  },
  libraryIcon: {
    width: 36,
    height: 36,
  },
  libraryCopy: {
    flex: 1,
    gap: 4,
  },
  libraryWatermark: {
    position: "absolute",
    right: 16,
    top: 13,
    width: 80,
    height: 80,
    opacity: 0.05,
  },
});
