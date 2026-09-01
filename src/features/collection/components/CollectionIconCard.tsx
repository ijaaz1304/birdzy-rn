/**
 * Collection Icon Card – for Wishlist and Owned.
 * Distinct from CollectionCard (grid): icon + title + subtitle, no thumbnail grid.
 */

import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import { useTheme } from "../../../hooks/useTheme";
import { Text } from "../../../atoms";
import { Card } from "../../../molecules";
import { Icon } from "../../../atoms";

export interface CollectionIconCardProps {
  item: {
    name: string;
    count?: number;
    subtitle?: string;
  };
  iconName: string;
  onPress?: () => void;
}

export const CollectionIconCard: React.FC<CollectionIconCardProps> = React.memo(
  ({ item, iconName, onPress }) => {
    const theme = useTheme();
    const colors = theme.colors;
    const Space = theme.spacing;

    const subtitle =
      item.subtitle ??
      (item.count !== undefined
        ? `${item.count} items`
        : "Your saved birds");

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        style={{ width: "48%", marginBottom: Space[3] }}
      >
        <Card
          variant="outlined"
          padding="medium"
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            minHeight: 140,
            backgroundColor: colors.surfaceSecondary,
            borderColor: colors.border,
          }}
        >
          <Icon
            name={iconName}
            size={28}
            color={colors.primary}
            style={{ marginBottom: Space[2] }}
          />
          <Text
            variant="title"
            size="small"
            weight="semibold"
            numberOfLines={1}
            style={{ marginBottom: Space[1], textAlign: "center" }}
          >
            {item.name}
          </Text>
          <Text
            variant="body"
            size="small"
            color="textSecondary"
            numberOfLines={2}
            style={styles.subtitle}
          >
            {subtitle}
          </Text>
        </Card>
      </TouchableOpacity>
    );
  }
);

CollectionIconCard.displayName = "CollectionIconCard";

const styles = StyleSheet.create({
  subtitle: {
    textAlign: "center",
  },
});
