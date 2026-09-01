/**
 * Empty Collections Component
 * Card-style empty state when user has no collections
 */

import React from "react";
import { View, StyleSheet } from "react-native";
import { EmptyState } from "../../../molecules";
import { Card } from "../../../molecules";
import { Images } from "../../../assets";
import { useTheme } from "../../../hooks/useTheme";

export const EmptyCollections: React.FC = () => {
  const theme = useTheme();

  return (
    <View style={styles.wrapper}>
      <Card
        variant="elevated"
        padding="large"
        style={[styles.card, { backgroundColor: theme.colors.surface }]}
      >
        <EmptyState
          image={Images.emptyCollection}
          imageStyle={styles.emptyImage}
          title="No collections yet"
          subtitle="Create a collection to organize your birds"
        />
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    padding: 24,
    paddingTop: 48,
  },
  card: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 240,
  },
  emptyImage: {
    width: 160,
    height: 160,
    marginTop: -24,
  },
});
