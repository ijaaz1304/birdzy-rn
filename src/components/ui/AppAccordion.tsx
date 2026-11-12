import React, { useState } from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { useTheme } from "../../design/theme";
import { Space } from "../../design/spacing";
import { Radius } from "../../design/radius";
import AppText from "./AppText";
import { Feather } from "@react-native-vector-icons/feather";

type Props = {
  title: string;
  items: string[];
  selected?: string | null;
  onSelect?: (value: string) => void;
};

const AppAccordion: React.FC<Props> = ({
  title,
  items,
  selected,
  onSelect,
}) => {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);

  const handleSelect = (item: string) => {
    onSelect?.(item);
  };

  return (
    <View style={[styles.wrapper]}>
      {/* Header */}
      <TouchableOpacity
        activeOpacity={0.8}
        style={[styles.header, { borderBottomColor: colors.border0 }]}
        onPress={() => setExpanded(!expanded)}
      >
        <AppText
          variant="body14"
          color={colors.textPrimary}
          style={{ flex: 1 }}
        >
          {title}
        </AppText>

        <Feather
          name={expanded ? "chevron-up" : "chevron-down"}
          size={20}
          color={colors.textSecondary}
        />
      </TouchableOpacity>

      {/* Body */}
      {expanded && (
        <View
          style={[styles.body, { backgroundColor: colors.surfaceSecondary }]}
        >
          {items.map((item) => (
            <TouchableOpacity
              key={item}
              style={styles.item}
              activeOpacity={0.8}
              onPress={() => handleSelect(item)}
            >
              <View
                style={[
                  styles.radioOuter,
                  {
                    borderColor:
                      selected === item
                        ? colors.textPrimary
                        : colors.textSecondary,
                  },
                ]}
              >
                {selected === item && (
                  <View
                    style={[
                      styles.radioInner,
                      {
                        backgroundColor:
                          selected === item
                            ? colors.textPrimary
                            : colors.textSecondary,
                      },
                    ]}
                  />
                )}
              </View>
              <View style={{ width: Space.sm }} />
              <AppText
                variant={selected === item ? "button14" : "body14"}
                color={
                  selected === item ? colors.textPrimary : colors.textSecondary
                }
              >
                {item}
              </AppText>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

export default AppAccordion;

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    borderRadius: Radius.card,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Space.xs,
    paddingHorizontal: Space.sm,
    borderBottomWidth: 2,
  },
  body: {
    paddingVertical: Space.xs,
    paddingHorizontal: Space.sm,
    gap: Space.xs,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: Space.xs,
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
