import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { ExpandableListProps } from "../../types/ui";
import { Text } from "../../atoms/Text";
import { useTheme } from "../../hooks/useTheme";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { TouchableOpacity } from "react-native";
export const ExpandableList: React.FC<ExpandableListProps> = ({
  title,
  items,
}) => {
  const theme = useTheme();
  const colors = theme.colors;
  const spacing = theme.spacing;
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <Text weight="semibold">{title}</Text>
        <MaterialIcons
          name={expanded ? "keyboard-arrow-up" : "keyboard-arrow-down"}
          size={24}
          color={colors.textSecondary}
        />
      </TouchableOpacity>
      {expanded && (
        <View style={[styles.itemsContainer, { marginTop: spacing[2] }]}>
          {items.map((item, index) => (
            <View
              key={index}
              style={[
                styles.item,
                index < items.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                  paddingBottom: spacing[2],
                  marginBottom: spacing[2],
                },
              ]}
            >
              <Text size="small">{item}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 32,
  },
  itemsContainer: {
    width: "100%",
  },
  item: {
    width: "100%",
  },
  arrowWrap: {
    justifyContent: "center",
    alignItems: "center",
  },
});
