import React from "react";
import { View, StyleSheet } from "react-native";
import AppText from "./AppText";
import { useTheme } from "../../hooks/useTheme";
import { Space } from "../../design";

type Props = {
  text?: string;
};

const AppDivider: React.FC<Props> = ({ text = "or" }) => {
  const theme = useTheme();
  const colors = theme.colors;

  return (
    <View style={styles.container}>
      <View style={[styles.line, { backgroundColor: colors.border0 }]} />
      <AppText variant="body14" color={colors.textTertiary} style={styles.text}>
        {text}
      </AppText>
      <View style={[styles.line, { backgroundColor: colors.border0 }]} />
    </View>
  );
};

export default AppDivider;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: Space.md,
  },
  line: {
    flex: 1,
    height: 1,
    opacity: 0.6,
  },
  text: {
    marginHorizontal: Space.sm,
  },
});
