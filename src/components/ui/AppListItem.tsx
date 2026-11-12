import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { useTheme } from "../../design/theme";
import { Space } from "../../design/spacing";
import { Radius } from "../../design/radius";
import AppText from "./AppText";

type Props = {
  label: string;
  selected?: boolean;
  showIcon?: boolean;
  onPress?: () => void;
};

const AppListItem: React.FC<Props> = ({
  label,
  selected = false,
  showIcon = true,
  onPress,
}) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        styles.container,
        {
          backgroundColor: selected
            ? colors.surfaceSecondary
            : colors.surfacePrimary,
          borderBottomColor: colors.border0,
          borderRadius: Radius.sm,
        },
      ]}
    >
      {showIcon && (
        <View
          style={[
            styles.circle,
            {
              borderColor: colors.textBrand,
            },
          ]}
        >
          {selected && (
            <View
              style={[
                styles.innerCircle,
                { backgroundColor: colors.textBrand },
              ]}
            />
          )}
        </View>
      )}
      <AppText
        variant="body14"
        color={selected ? colors.textPrimary : colors.textSecondary}
        style={{ fontWeight: selected ? "500" : "400" }}
      >
        {label}
      </AppText>
    </TouchableOpacity>
  );
};

export default AppListItem;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Space.sm, // 8px
    paddingHorizontal: Space.md, // 12px
    width: "100%",
    gap: Space.sm, // 8px between icon & text
  },
  circle: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  innerCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
