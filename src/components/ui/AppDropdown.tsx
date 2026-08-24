import React, { useState } from "react";
import { View, TouchableOpacity, StyleSheet, FlatList } from "react-native";
import { useTheme } from "../../design/theme";
import { UI_COLORS } from "../../constants/colorConstants";
import { Radius } from "../../design/radius";
import { Space } from "../../design/spacing";
import AppText from "./AppText";

type Props = {
  label?: string;
  options: string[];
  selected: string | null;
  onSelect: (value: string) => void;
  placeholder?: string;
  width?: number | string;
};

const AppDropdown: React.FC<Props> = ({
  label,
  options,
  selected,
  onSelect,
  placeholder = "Select an option",
}) => {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);

  const handleSelect = (value: string) => {
    onSelect(value);
    setExpanded(false);
  };

  return (
    <View style={[styles.wrapper, { width: "100%" }]}>
      {label && (
        <AppText
          variant="body14"
          color={colors.textSecondary}
          style={{ marginBottom: Space.xs }}
        >
          {label}
        </AppText>
      )}

      {/* Header */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => setExpanded(!expanded)}
        style={[
          styles.header,
          {
            backgroundColor: colors.surfacePrimary,
            borderColor: colors.border0,
            shadowColor: UI_COLORS.SHADOW,
          },
        ]}
      >
        <AppText
          variant="body14"
          color={selected ? colors.textPrimary : colors.textSecondary}
        >
          {selected || placeholder}
        </AppText>
      </TouchableOpacity>

      {/* Dropdown list */}
      {expanded && (
        <View
          style={[
            styles.dropdown,
            {
              backgroundColor: colors.surfacePrimary,
              borderColor: colors.border0,
              shadowColor: UI_COLORS.SHADOW,
            },
          ]}
        >
          <FlatList
            data={options}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.item,
                  {
                    backgroundColor:
                      item === selected
                        ? colors.surfaceSecondary
                        : colors.surfacePrimary,
                  },
                ]}
                onPress={() => handleSelect(item)}
              >
                <AppText
                  variant="body14"
                  color={
                    item === selected
                      ? colors.textPrimary
                      : colors.textSecondary
                  }
                >
                  {item}
                </AppText>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
};

export default AppDropdown;

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: "flex-start",
  },
  header: {
    borderWidth: 1,
    borderRadius: Radius.sm,
    paddingVertical: 8,
    paddingHorizontal: 12,
    elevation: 2,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  dropdown: {
    marginTop: 2,
    borderWidth: 1,
    borderRadius: Radius.sm,
    elevation: 2,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  item: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
});
