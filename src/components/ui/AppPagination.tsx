import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { Space } from "../../design/spacing";
import AppPaginationAtom from "./AppPaginationAtom";

type Props = {
  total: number;
  activeIndex: number;
  containerStyle?: ViewStyle;
};

const AppPagination: React.FC<Props> = ({
  total,
  activeIndex,
  containerStyle,
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      {Array.from({ length: total }).map((_, i) => (
        <AppPaginationAtom key={i} active={i === activeIndex} />
      ))}
    </View>
  );
};

export default AppPagination;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Space.xs, // even spacing between dots
  },
});
