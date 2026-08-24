/**
 * Discount Modal Screen
 */

import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import Icon from "react-native-vector-icons/Ionicons";
import { useTheme } from "../../../hooks/useTheme";
import { Text } from "../../../atoms";
import { Card } from "../../../molecules";
import { PrimaryButton } from "../../../atoms/PrimaryButton/PrimaryButton";
import { SubscriptionStackParamList } from "../../../navigation/types";

import { spacing } from "../../../design-system/spacing";

type DiscountModalScreenRouteProp = RouteProp<
  SubscriptionStackParamList,
  "DiscountModal"
>;

export const DiscountModalScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute<DiscountModalScreenRouteProp>();
  const { discountCode } = route.params || {};

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="close" size={28} color={theme.colors.text} />
        </TouchableOpacity>
        <Text variant="title" size="medium" weight="semibold">
          Discount Code
        </Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <Card variant="elevated" padding="large">
          <Text
            variant="headline"
            size="medium"
            weight="bold"
            style={styles.title}
          >
            Special Offer!
          </Text>
          <Text
            variant="body"
            size="medium"
            color="textSecondary"
            style={styles.description}
          >
            {discountCode
              ? `Use code ${discountCode} for a discount!`
              : "Enter a discount code to save on your subscription."}
          </Text>
          <PrimaryButton
            title="Apply Discount"
            onPress={() => {
              // TODO: Implement discount application
              navigation.goBack();
            }}
          />
        </Card>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing[4],
  },
  placeholder: {
    width: 28,
  },
  content: {
    flex: 1,
    padding: spacing[4],
    justifyContent: "center",
  },
  title: {
    marginBottom: 12,
  },
  description: {
    marginBottom: 24,
  },
});
