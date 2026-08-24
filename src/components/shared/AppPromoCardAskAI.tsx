import { AppImageBackground } from "@/components/AppImage";
import React, { useState } from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import { useTheme, useIsDark } from "../../hooks/useTheme";
import { APP_COLORS } from "../../config/colors";

import { FONTS } from "../../common/typography";

import { Radius } from "../../design";

type Props = {
  background: any; // image source
  onPress?: () => void; // tap anywhere on banner to open Ask AI screen
  onSend?: (text: string) => void;
};

const AppPromoCardAskAI: React.FC<Props> = ({
  background,
  onPress,
}) => {
  const theme = useTheme();
  const _colors = theme.colors;
  const [_message, _setMessage] = useState("");
  const _isDark = useIsDark();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.95}
      style={styles.card}
    >
      <AppImageBackground
        source={background}
        resizeMode="cover"
        style={styles.background}
      >
        {/* Banner image (ask_ai_full.png) already contains all design for light/dark — no inner UI */}
        {/* <LinearGradient ... />
        <View style={styles.content}>
          <AppText ...>Ask AI ✨</AppText>
          <AppText ...>Get instant answer with AI chatbot</AppText>
          <View style={styles.inputRow}>
            <AppTextField ... />
            <TouchableOpacity ...><Feather name="send" ... /></TouchableOpacity>
          </View>
        </View> */}
      </AppImageBackground>
    </TouchableOpacity>
  );
};

export default AppPromoCardAskAI;

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.md,
    overflow: "hidden",
    height: 150,
    marginBottom: 24,
  },
  background: {
    flex: 1,
    justifyContent: "flex-end",
  },
  content: {
    padding: 24, // Space.lg equivalent
  },
  title: {
    fontFamily: FONTS.bold,
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 16, // Space.md equivalent
  },
  inputRow: {
    position: "relative",
  },
  textField: {
    borderColor: APP_COLORS.borderLight,
  },
  sendButtonWrap: {
    position: "absolute",
    right: 8,
    top: 8,
    bottom: 8,
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  sendIcon: {
    // Icon sized by Feather props
  },
});
