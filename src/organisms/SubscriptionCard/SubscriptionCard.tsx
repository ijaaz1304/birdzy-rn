/**
 * SubscriptionCard organism component
 */

import React from "react";
import { View, StyleSheet, ViewStyle, StyleProp } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { Text } from "../../atoms";
import { Icon } from "../../atoms";
import { Button } from "../../atoms";
import { Card } from "../../molecules";

import { Radius } from "../../design";

export interface SubscriptionFeature {
  id: string;
  label: string;
  included: boolean;
}

export interface SubscriptionCardProps {
  id: string;
  title: string;
  price: string;
  period?: string;
  description?: string;
  features?: SubscriptionFeature[];
  isPopular?: boolean;
  isSelected?: boolean;
  isActive?: boolean;
  onSelect?: () => void;
  onSubscribe?: () => void;
  variant?: "default" | "compact";
  style?: StyleProp<ViewStyle>;
}

export const SubscriptionCard: React.FC<SubscriptionCardProps> = ({
  id: _id,
  title,
  price,
  period = "month",
  description,
  features = [],
  isPopular = false,
  isSelected = false,
  isActive = false,
  onSelect,
  onSubscribe,
  variant = "default",
  style,
}) => {
  const theme = useTheme();

  if (variant === "compact") {
    return (
      <Card
        onPress={onSelect}
        padding="medium"
        variant={isSelected ? "elevated" : "outlined"}
        style={[
          styles.compactCard,
          isSelected && {
            borderColor: theme.colors.primary,
            borderWidth: 2,
          },
          style,
        ]}
      >
        <View style={styles.compactHeader}>
          <View style={styles.compactTitleContainer}>
            <Text variant="title" size="medium" weight="semibold">
              {title}
            </Text>
            {isPopular && (
              <View
                style={[
                  styles.popularBadge,
                  { backgroundColor: theme.colors.primary },
                ]}
              >
                <Text
                  variant="label"
                  size="small"
                  color="textInverse"
                  weight="semibold"
                >
                  Popular
                </Text>
              </View>
            )}
          </View>
          <View style={styles.compactPriceContainer}>
            <Text variant="headline" size="large" weight="bold" color="primary">
              {price}
            </Text>
            <Text variant="body" size="small" color="textSecondary">
              /{period}
            </Text>
          </View>
        </View>
        {description && (
          <Text
            variant="body"
            size="small"
            color="textSecondary"
            style={styles.compactDescription}
          >
            {description}
          </Text>
        )}
        {isSelected && (
          <View style={styles.selectedIndicator}>
            <Icon name="check-circle" size={20} color={theme.colors.primary} />
            <Text variant="body" size="small" color="primary" weight="medium">
              Selected
            </Text>
          </View>
        )}
      </Card>
    );
  }

  return (
    <Card
      onPress={onSelect}
      padding="large"
      variant={isSelected ? "elevated" : "outlined"}
      style={[
        styles.card,
        isSelected && {
          borderColor: theme.colors.primary,
          borderWidth: 2,
        },
        isActive && {
          backgroundColor: theme.colors.primaryLight + "10",
        },
        style,
      ]}
    >
      {isPopular && (
        <View
          style={[
            styles.popularBadge,
            styles.popularBadgeAbsolute,
            { backgroundColor: theme.colors.primary },
          ]}
        >
          <Text
            variant="label"
            size="small"
            color="textInverse"
            weight="semibold"
          >
            Most Popular
          </Text>
        </View>
      )}

      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text variant="headline" size="medium" weight="bold">
            {title}
          </Text>
          {isActive && (
            <View
              style={[
                styles.activeBadge,
                { backgroundColor: theme.colors.success },
              ]}
            >
              <Text
                variant="label"
                size="small"
                color="textInverse"
                weight="semibold"
              >
                Active
              </Text>
            </View>
          )}
        </View>
        <View style={styles.priceContainer}>
          <Text variant="display" size="small" weight="bold" color="primary">
            {price}
          </Text>
          <Text variant="body" size="medium" color="textSecondary">
            /{period}
          </Text>
        </View>
      </View>

      {description && (
        <Text
          variant="body"
          size="medium"
          color="textSecondary"
          style={styles.description}
        >
          {description}
        </Text>
      )}

      {features.length > 0 && (
        <View style={styles.featuresContainer}>
          {features.map((feature) => (
            <View key={feature.id} style={styles.featureItem}>
              <Icon
                name={feature.included ? "check-circle" : "close-circle"}
                size={20}
                color={
                  feature.included ? theme.colors.success : theme.colors.error
                }
              />
              <Text
                variant="body"
                size="small"
                color={feature.included ? "text" : "textTertiary"}
                style={[
                  styles.featureText,
                  !feature.included && styles.featureTextDisabled,
                ]}
              >
                {feature.label}
              </Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.actions}>
        {isActive ? (
          <View style={styles.activeIndicator}>
            <Icon name="check-circle" size={24} color={theme.colors.success} />
            <Text
              variant="body"
              size="medium"
              color="success"
              weight="semibold"
            >
              Currently Active
            </Text>
          </View>
        ) : (
          <Button
            title={isSelected ? "Selected" : "Select Plan"}
            variant={isSelected ? "primary" : "outline"}
            size="large"
            fullWidth
            onPress={onSubscribe || onSelect}
            disabled={isSelected}
          />
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    position: "relative",
    marginBottom: 16,
  },
  compactCard: {
    marginBottom: 12,
  },
  popularBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.md,
    alignSelf: "flex-start",
  },
  popularBadgeAbsolute: {
    position: "absolute",
    top: -10,
    right: 16,
  },
  header: {
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  activeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.md,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  compactHeader: {
    marginBottom: 8,
  },
  compactTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  compactPriceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  compactDescription: {
    marginTop: 4,
  },
  description: {
    marginBottom: 16,
  },
  featuresContainer: {
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  featureText: {
    marginLeft: 12,
    flex: 1,
  },
  featureTextDisabled: {
    textDecorationLine: "line-through",
  },
  actions: {
    marginTop: 8,
  },
  activeIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
  },
  selectedIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    gap: 6,
  },
});
