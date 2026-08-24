/**
 * Renders a list of subscription plan cards with dynamic prices.
 * Pass `plans` from useSubscriptionPlansWithPrices() for store prices; otherwise shows placeholders.
 */

import React from "react";
import { View } from "react-native";
import { PlanCard } from "./PlanCard";

export type PlanItem = {
  id: string;
  title: string;
  price: string;
  subtitle?: string;
  badge?: string;
};

export type PlansListProps = {
  /** Plans with dynamic prices (e.g. from useSubscriptionPlansWithPrices). When provided, these are rendered. */
  plans?: PlanItem[];
  /** Called when a plan card is pressed. planId = plan.id */
  onSelectPlan?: (planId: string) => void;
  /** Currently selected plan id (for highlight). */
  selectedPlanId?: string;
  /** Legacy: when plans not provided, these callbacks are used for the placeholder cards. */
  onSelectMonthly?: () => void;
  onSelectAnnual?: () => void;
  onSelectLifetime?: () => void;
  /** Legacy: when plans not provided, selectedPlan is used for placeholder cards. */
  selectedPlan?: "monthly" | "annual" | "lifetime";
};

export const PlansList: React.FC<PlansListProps> = ({
  plans,
  onSelectPlan,
  selectedPlanId,
}) => {
  if (plans && plans.length > 0) {
    return (
      <View>
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            title={plan.title}
            price={plan.price}
            subtitle={plan.subtitle}
            badge={plan.badge}
            onPress={() => onSelectPlan?.(plan.id)}
            selected={selectedPlanId === plan.id}
          />
        ))}
      </View>
    );
  }

  return null;
};
