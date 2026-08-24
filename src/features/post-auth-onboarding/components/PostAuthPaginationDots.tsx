import React from "react";
import { StyleSheet, View } from "react-native";
import { APP_COLORS } from "../../../../theme/colors";

type Props = {
  total: number;
  activeIndex: number;
  activeColor?: string;
  inactiveColor?: string;
};

export const PostAuthPaginationDots: React.FC<Props> = ({
  total,
  activeIndex,
  activeColor = APP_COLORS.paginationDotSelectedLight,
  inactiveColor = APP_COLORS.paginationDotUnselectedLight,
}) => (
  <View style={styles.row}>
    {Array.from({ length: total }).map((_, index) => (
      <View
        key={index}
        style={[
          styles.dot,
          index === activeIndex
            ? [styles.dotActive, { backgroundColor: activeColor }]
            : { backgroundColor: inactiveColor },
        ]}
      />
    ))}
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    height: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 8,
    borderRadius: 4,
  },
});
