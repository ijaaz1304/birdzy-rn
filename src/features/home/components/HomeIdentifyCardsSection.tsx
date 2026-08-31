import { AppImage } from "@/components/AppImage";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { AppText } from "../../../components/shared";
import { Images } from "../../../assets";
import { HOME_STRINGS } from "../../../config/strings/home.strings";
import { FONTS } from "../../../common/typography";
import { useTheme } from "../../../hooks/useTheme";
import { Radius } from "../../../design";

/** Identify by sound card — rgba(1, 71, 79, 1) */
const SOUND_CARD_BG = "#01474F";
/** Identify by photo card — rgba(235, 228, 238, 1) */
const PHOTO_CARD_BG = "#EBE4EE";

type Props = {
  onSoundPress: () => void;
  onPhotoPress: () => void;
};

export const HomeIdentifyCardsSection: React.FC<Props> = ({
  onSoundPress,
  onPhotoPress,
}) => {
  const theme = useTheme();
  const strings = HOME_STRINGS.discovery;

  return (
    <View style={styles.row}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onSoundPress}
        style={[styles.card, { backgroundColor: SOUND_CARD_BG }]}
      >
        <View style={styles.cardHeader}>
          <AppText
            variant="body14"
            style={[styles.cardTitle, styles.cardTitleOnDark]}
          >
            {strings.soundIdentify.title}
          </AppText>
          <MaterialIcons name="chevron-right" size={20} color="#FFFFFF" />
        </View>
        <View style={styles.soundIllustration}>
          <AppImage
            source={Images.homeIdentifyBySound}
            style={styles.illustrationImage}
            resizeMode="contain"
          />
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPhotoPress}
        style={[styles.card, { backgroundColor: PHOTO_CARD_BG }]}
      >
        <View style={styles.cardHeader}>
          <AppText
            variant="body14"
            style={[styles.cardTitle, { color: theme.colors.textPrimary }]}
          >
            {strings.identifyByPhoto.title}
          </AppText>
          <MaterialIcons
            name="chevron-right"
            size={20}
            color={theme.colors.textPrimary}
          />
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
    lineHeight: 20,
    flex: 1,
    paddingRight: 4,
  },
  cardTitleOnDark: {
    color: "#FFFFFF",
  },
  soundIllustration: {
    height: 72,
    borderRadius: 8,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
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
