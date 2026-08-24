/**
 * Plan Selector Sheet Component
 * Bottom sheet for selecting subscription plans (Monthly / Annual / Lifetime)
 * Uses @gorhom/bottom-sheet
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import BottomSheet, { BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import { useTheme, useIsDark } from "../../hooks/useTheme";
import { Text, Button } from "../../atoms";
import { CancelIconLight, CancelIconDark } from "../../assets";
import { PlanCard } from "../../components/subscription";
import { PlanType } from "../../data/subscription/subscriptionPlans";
import { useSubscriptionPlansWithPrices } from "../../features/subscription/hooks/useSubscriptionPlansWithPrices";

interface PlanSelectorSheetProps {
  visible: boolean;
  onClose: () => void;
  /** Called when user taps Subscribe; if provided, runs IAP flow and sheet stays open until success/failure. */
  onSubscribe?: (planId: PlanType) => Promise<void>;
  /** When true, Subscribe button shows loading and is disabled. */
  isPurchasing?: boolean;
  /** Legacy: called only when Subscribe is tapped and onSubscribe is not provided. */
  onSelectPlan?: (planId: PlanType) => void;
}

export const PlanSelectorSheet: React.FC<PlanSelectorSheetProps> = ({
  visible,
  onClose,
  onSubscribe,
  isPurchasing = false,
  onSelectPlan,
}) => {
  const theme = useTheme();
  const colors = theme.colors;
  const spacing = theme.spacing;
  const _radius = theme.radius;
  const isDark = useIsDark();

  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["85%"], []);

  const { plans: plansWithPrices, defaultSelectedPlanId } =
    useSubscriptionPlansWithPrices();
  const plans = plansWithPrices.map((p) => ({
    id: p.id,
    title: p.title,
    price: p.priceDisplay,
    subtitle: p.subtitle,
    badge: p.badge,
    description: p.descriptionLines,
    ctaLabel: p.ctaLabel,
    recurring: p.recurring,
  }));
  const [selectedPlan, setSelectedPlan] = useState<PlanType>(
    defaultSelectedPlanId
  );

  useEffect(() => {
    if (visible) {
      if (__DEV__) {
        console.log("[Overlay] PlanSelectorSheet opened");
      }
      // Small delay to ensure proper rendering
      setTimeout(() => {
        sheetRef.current?.expand();
      }, 100);
    } else {
      sheetRef.current?.close();
    }
  }, [visible]);

  const handleSelectPlan = (planId: PlanType) => {
    setSelectedPlan(planId);
  };

  const handleSubscribe = async () => {
    if (onSubscribe) {
      try {
        await onSubscribe(selectedPlan);
        onClose();
      } catch (_err) {
        // Error surfaced by hook / parent (e.g. alert)
      }
      return;
    }
    onSelectPlan?.(selectedPlan);
    onClose();
  };

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        opacity={0.6}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
      />
    ),
    []
  );

  const selectedPlanData = plans.find((p) => p.id === selectedPlan);

  if (!visible) return null;

  return (
    <BottomSheet
      ref={sheetRef}
      index={visible ? 0 : -1}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onClose}
      backgroundStyle={{ backgroundColor: colors.surfacePrimary }}
      handleIndicatorStyle={{ backgroundColor: colors.border }}
      backdropComponent={renderBackdrop}
      enableContentPanningGesture={true}
    >
      <View style={[styles.container, { padding: spacing[6] }]}>
        {/* Close Button - Top Right */}
        <TouchableOpacity
          style={[styles.close, { top: spacing[4], right: spacing[4] }]}
          onPress={onClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          {isDark ? (
            <CancelIconDark width={24} height={24} />
          ) : (
            <CancelIconLight width={24} height={24} />
          )}
        </TouchableOpacity>

        <ScrollView showsVerticalScrollIndicator={false}>
          <Text
            variant="headline"
            size="large"
            weight="bold"
            style={{ color: colors.textPrimary, marginBottom: spacing[4] }}
          >
            Birdzy Premium
          </Text>

          {/* Plan Cards */}
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              title={plan.title}
              price={plan.price}
              subtitle={plan.subtitle}
              badge={plan.badge}
              selected={selectedPlan === plan.id}
              onPress={() => handleSelectPlan(plan.id)}
            />
          ))}

          {/* CTA Button - Fixed at bottom */}
          <Button
            title={
              isPurchasing
                ? "Processing…"
                : selectedPlanData?.ctaLabel || "Subscribe"
            }
            variant="primary"
            size="large"
            fullWidth
            onPress={handleSubscribe}
            disabled={isPurchasing}
            style={{ marginTop: spacing[6], marginBottom: spacing[4] }}
          />
        </ScrollView>
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  close: {
    position: "absolute",
    zIndex: 10,
  },
});
