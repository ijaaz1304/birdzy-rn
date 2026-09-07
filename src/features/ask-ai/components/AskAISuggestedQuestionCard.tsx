import { AppImage } from "@/components/AppImage";
import React from "react";
import {
  ImageSourcePropType,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Text } from "../../../atoms";
import { useTheme } from "../../../hooks/useTheme";

type Props = {
  question: string;
  icon: ImageSourcePropType;
  onPress: () => void;
};

const CARD_HEIGHT = 64;
const ICON_SIZE = 32;
const CARD_BORDER_RADIUS = 12;

export function AskAISuggestedQuestionCard({ question, icon, onPress }: Props) {
  const theme = useTheme();
  const colors = theme.colors;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        styles.card,
        {
          borderColor: colors.border0,
          backgroundColor: colors.surfacePrimary,
        },
      ]}
    >
      <View style={styles.iconWrap}>
        <AppImage
          source={icon}
          style={styles.icon}
          resizeMode="contain"
        />
      </View>
      <Text
        variant="body"
        size="small"
        weight="medium"
        numberOfLines={2}
        style={[styles.question, { color: colors.textPrimary }]}
      >
        {question}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: CARD_HEIGHT,
    borderWidth: 1,
    borderRadius: CARD_BORDER_RADIUS,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    width: "100%",
  },
  iconWrap: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    flexShrink: 0,
  },
  icon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
  },
  question: {
    flex: 1,
    lineHeight: 16,
  },
});
