import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { SectionCardProps } from "../../types/ui";
import { Text } from "../../atoms/Text";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useTheme } from "../../hooks/useTheme";

export const SectionCard = ({
  icon,
  title,
  children,
  onPress,
  showArrow = false,
  /** UI-only overrides (optional) */
  backgroundColor,
  _borderRadius,
  padding,
  containerStyle,
}: SectionCardProps) => {
  const theme = useTheme();
  const colors = theme.colors;
  const spacing = theme.spacing;
  const _radius = theme.radius;

  const Wrapper = onPress ? TouchableOpacity : View;

  return (
    <Wrapper
      style={[
        styles.card,
        {
          backgroundColor: backgroundColor ?? colors.surfacePrimary,
          padding: padding ?? spacing[4],
        },
        containerStyle,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {(title != null && title !== "") || icon || showArrow ? (
        <View style={styles.header}>
          <View style={styles.row}>
            {icon}
            {title != null && title !== "" ? (
              <Text
                variant="title"
                size="medium"
                weight="semibold"
                style={[styles.title, !icon && { marginLeft: 0 }]}
              >
                {title}
              </Text>
            ) : null}
          </View>
          {showArrow && (
            <MaterialIcons
              name="chevron-right"
              size={22}
              color={colors.textSecondary}
            />
          )}
        </View>
      ) : null}
      {children}
    </Wrapper>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    marginLeft: 8,
  },
});
