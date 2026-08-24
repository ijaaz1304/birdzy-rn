import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { useTheme } from "../../design/theme";

type Props = {
  active?: boolean;
  style?: ViewStyle;
};

const AppPaginationAtom: React.FC<Props> = ({ active = false, style }) => {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.dot,
        {
          backgroundColor: active
            ? colors.dotSelected
            : colors.dotUnselected,
          width: active ? 24 : 6,
          borderRadius: 100,
        },
        style,
      ]}
    />
  );
};

export default AppPaginationAtom;

const styles = StyleSheet.create({
  dot: {
    height: 6,
  },
});
