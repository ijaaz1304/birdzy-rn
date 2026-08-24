/**
 * Accordion molecule component
 * Optimized and dynamic version of AppAccordion
 */

import React, { useState } from "react";
import { View, TouchableOpacity, StyleSheet, ViewStyle } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { Text } from "../../atoms";
import { Icon } from "../../atoms";
import { RadioButton } from "../../atoms";

import { Radius } from "../../design";

export interface AccordionItem {
  label: string;
  value: string;
}

export interface AccordionProps {
  title: string;
  items: AccordionItem[] | string[];
  selected?: string | null;
  onSelect?: (value: string) => void;
  variant?: "default" | "radio" | "checkbox";
  style?: ViewStyle;
  headerStyle?: ViewStyle;
  itemStyle?: ViewStyle;
}

export const Accordion: React.FC<AccordionProps> = ({
  title,
  items,
  selected,
  onSelect,
  variant = "radio",
  style,
  headerStyle,
  itemStyle,
}) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);

  const handleSelect = (value: string) => {
    onSelect?.(value);
    if (variant === "default") {
      setExpanded(false);
    }
  };

  const normalizedItems: AccordionItem[] = items.map((item) =>
    typeof item === "string" ? { label: item, value: item } : item
  );

  return (
    <View style={[styles.wrapper, style]}>
      {/* Header */}
      <TouchableOpacity
        activeOpacity={0.8}
        style={[
          styles.header,
          {
            borderBottomColor: theme.colors.border0,
          },
          headerStyle,
        ]}
        onPress={() => setExpanded(!expanded)}
      >
        <Text variant="body" size="medium" color="text" style={{ flex: 1 }}>
          {title}
        </Text>

        <Icon
          name={expanded ? "chevron-up" : "chevron-down"}
          size={20}
          color={theme.colors.textSecondary}
        />
      </TouchableOpacity>

      {/* Body */}
      {expanded && (
        <View
          style={[
            styles.body,
            {
              backgroundColor: theme.colors.surfaceSecondary,
            },
          ]}
        >
          {normalizedItems.map((item) => {
            const isSelected = selected === item.value;

            return (
              <TouchableOpacity
                key={item.value}
                style={[styles.item, itemStyle]}
                activeOpacity={0.8}
                onPress={() => handleSelect(item.value)}
              >
                {variant === "radio" && (
                  <RadioButton
                    selected={isSelected}
                    size="small"
                    style={styles.radio}
                  />
                )}
                {variant === "checkbox" && (
                  <View
                    style={[
                      styles.checkbox,
                      {
                        borderColor: isSelected
                          ? theme.colors.textPrimary
                          : theme.colors.textSecondary,
                      },
                    ]}
                  >
                    {isSelected && (
                      <View
                        style={[
                          styles.checkboxInner,
                          {
                            backgroundColor: theme.colors.textPrimary,
                          },
                        ]}
                      />
                    )}
                  </View>
                )}
                <Text
                  variant={isSelected ? "label" : "body"}
                  size="medium"
                  color={isSelected ? "text" : "textSecondary"}
                  weight={isSelected ? "semibold" : "normal"}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: Radius.md,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 2,
  },
  body: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 8,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  radio: {
    marginRight: 0,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
