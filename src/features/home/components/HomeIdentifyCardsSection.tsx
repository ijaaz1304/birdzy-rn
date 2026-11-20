import { getResponsiveGridColumns } from "@/utils/responsiveLayout";
import { AppImage } from "@/components/AppImage";
import React from "react";
import {
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { AppText } from "../../../components/shared";
import IdentifySoundArrow from "../../../assets/home/identify_sound_arrow.svg";
import IdentifySoundBird from "../../../assets/home/identify_sound_bird.svg";
import IdentifySoundWave from "../../../assets/home/identify_sound_wave.svg";
import { Images } from "../../../assets";
import { HOME_STRINGS } from "../../../config/strings/home.strings";
import { FONTS } from "../../../common/typography";
import { useTheme, useIsDark } from "../../../hooks/useTheme";
import { Radius } from "../../../design";

/** Identify by sound card background */
const SOUND_CARD_BG = "#01474F";
const SOUND_PANEL_BG = "rgba(255,255,255,0.9)";
/** Card titles wrap, then ellipsize. Font size stays the Figma token at every width. */
const CARD_TITLE_MAX_LINES = 3;

type Props = {
  onSoundPress: () => void;
  onPhotoPress: () => void;
};

export const HomeIdentifyCardsSection: React.FC<Props> = ({
  onSoundPress,
  onPhotoPress,
}) => {
  const theme = useTheme();
  const isDark = useIsDark();
  const strings = HOME_STRINGS.discovery;
  const cardBg = isDark ? theme.colors.surfaceSecondary : "#EBE4EE";
  const titleColor = theme.colors.textPrimary;
  const { width: windowWidth, fontScale } = useWindowDimensions();
  const stacked = getResponsiveGridColumns(windowWidth, fontScale) === 1;

  return (
    <View style={[styles.row, stacked && { flexDirection: "column" }]}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onSoundPress}
        style={styles.soundCard}
        accessibilityRole="button"
        accessibilityLabel={strings.soundIdentify.title}
      >
        <View style={styles.soundHeader}>
          <AppText
            variant="body14"
            numberOfLines={CARD_TITLE_MAX_LINES}
            ellipsizeMode="tail"
            style={styles.soundTitle}
          >
            {strings.soundIdentify.title}
          </AppText>
          <View style={styles.arrowSlot}>
            <IdentifySoundArrow />
          </View>
        </View>
        <View style={styles.soundPanel}>
          <View style={styles.wave}>
            <IdentifySoundWave />
          </View>
          <View style={styles.bird}>
            <IdentifySoundBird />
          </View>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPhotoPress}
        style={[styles.card, { backgroundColor: cardBg }]}
      >
        <View style={styles.cardHeader}>
          <AppText
            variant="body14"
            numberOfLines={CARD_TITLE_MAX_LINES}
            ellipsizeMode="tail"
            style={[styles.cardTitle, { color: titleColor }]}
          >
            {strings.identifyByPhoto.title}
          </AppText>
          <MaterialIcons name="chevron-right" size={20} color={titleColor} />
        </View>
        <View style={styles.photoIllustration}>
          <AppImage
            source={Images.homeIdentifyByPhoto}
            style={styles.illustrationImage}
            resizeMode="contain"
          />
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  soundCard: {
    flex: 1,
    backgroundColor: SOUND_CARD_BG,
    borderRadius: 12,
    padding: 12,
    gap: 12,
    overflow: "hidden",
  },
  soundHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    width: "100%",
    gap: 4,
  },
  soundTitle: {
    flex: 1,
    fontFamily: FONTS.bold,
    color: "#FFFFFF",
  },
  arrowSlot: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  soundPanel: {
    minHeight: 72,
    width: "100%",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: SOUND_PANEL_BG,
  },
  wave: {
    position: "absolute",
    left: 10,
    top: 0,
  },
  bird: {
    position: "absolute",
    top: 9,
    right: 8.5,
    transform: [{ scaleX: -1 }],
  },
  card: {
    flex: 1,
    borderRadius: Radius.md,
    padding: 12,
    gap: 12,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    width: "100%",
  },
  cardTitle: {
    fontFamily: FONTS.bold,
    flex: 1,
    paddingRight: 4,
  },
  photoIllustration: {
    height: 72,
    borderRadius: 8,
    overflow: "hidden",
  },
  illustrationImage: {
    width: "100%",
    height: "100%",
  },
});
