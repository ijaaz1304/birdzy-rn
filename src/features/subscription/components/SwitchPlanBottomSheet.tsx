import React, { useEffect, useMemo, useState } from "react";
import { Alert, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { PlanId } from "../../../config/subscriptionConfig";
import { FONTS } from "../../../common/typography";
import { PostAuthGradientButton } from "../../post-auth-onboarding/components/PostAuthGradientButton";
import { PostAuthHorizontalPlanCard, HORIZONTAL_PLAN_ROW_STYLE } from "../../post-auth-onboarding/components/PostAuthHorizontalPlanCard";
import {
  getPlanCardTrialDays,
  getPlanCardPriceView,
  getPlanDisplayTitle,
  localizeCompareAtPriceDisplay,
} from "../../post-auth-onboarding/utils/planDisplay";
import { getCompareAtPriceDisplay } from "../utils/storePlanPricing";
import {
  getPostAuthOnboardingColors,
  POST_AUTH_LAYOUT,
} from "../../post-auth-onboarding/constants";
import { usePostAuthOnboardingIsDark } from "../../post-auth-onboarding/utils/theme";
import { getAllSubscriptionPlans } from "../../../data/subscription/subscriptionPlansLoader";
import { useSubscriptionPlansWithPrices } from "../hooks/useSubscriptionPlansWithPrices";
import {
  getSwitchOptionCardTitle,
  getSwitchPlanCtaLabel,
  getSwitchSheetPlansForCurrentKind,
  getSwitchSheetTitle,
  planMatchesKind,
  type SubscriptionPlanKind,
} from "../utils/subscriptionStatusDisplay";

const SHEET_SURFACE = "#FFFFFF";
const SHEET_TOP_RADIUS = 16;

type Props = {
  visible: boolean;
  currentPlanKind: SubscriptionPlanKind;
  onClose: () => void;
  onSubscribe: (planId: PlanId) => Promise<void>;
  onDowngrade: () => Promise<void>;
  isPurchasing?: boolean;
  isDowngrading?: boolean;
};

export const SwitchPlanBottomSheet: React.FC<Props> = ({
  visible,
  currentPlanKind,
  onClose,
  onSubscribe,
  onDowngrade,
  isPurchasing = false,
  isDowngrading = false,
}) => {
  const insets = useSafeAreaInsets();
  const isDark = usePostAuthOnboardingIsDark();
  const colors = useMemo(() => getPostAuthOnboardingColors(isDark), [isDark]);
  const { plans, isLoadingPrices, storePrices } = useSubscriptionPlansWithPrices();

  const switchablePlans = useMemo(() => {
    const catalogTargets = getSwitchSheetPlansForCurrentKind(
      getAllSubscriptionPlans(),
      currentPlanKind
    );
    return catalogTargets
      .map((catalogPlan) =>
        plans.find(
          (plan) =>
            plan.id === catalogPlan.id ||
            (plan.duration ?? "").toLowerCase() ===
              (catalogPlan.duration ?? "").toLowerCase()
        )
      )
      .filter((plan): plan is NonNullable<typeof plan> => plan != null);
  }, [currentPlanKind, plans]);

  const defaultSelectedId = useMemo(
    () => (switchablePlans[0]?.id ?? null) as PlanId | null,
    [switchablePlans]
  );

  const [selectedPlanId, setSelectedPlanId] = useState<PlanId | null>(
    defaultSelectedId
  );

  useEffect(() => {
    if (visible) {
      setSelectedPlanId(defaultSelectedId);
    }
  }, [visible, defaultSelectedId]);

  const selectedPlan = switchablePlans.find(
    (plan) => plan.id === selectedPlanId
  );

  const ctaLabel = useMemo(
    () => getSwitchPlanCtaLabel(selectedPlan, isPurchasing),
    [isPurchasing, selectedPlan]
  );

  const isSelectedCurrentPlan = selectedPlan
    ? planMatchesKind(selectedPlan, currentPlanKind)
    : true;

  const handleDowngrade = () => {
    Alert.alert(
      "Downgrade to Free Plan",
      "Your premium access will remain until the end of your current billing cycle. After that, you will lose access to premium features.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Continue",
          style: "destructive",
          onPress: () => {
            void onDowngrade().then(() => onClose());
          },
        },
      ]
    );
  };

  if (!visible || switchablePlans.length === 0) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropPress} onPress={onClose} />
        <View
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}
        >
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <MaterialIcons
                name="close"
                size={16}
                color={colors.textPrimary}
              />
            </TouchableOpacity>
          </View>

          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {getSwitchSheetTitle(currentPlanKind)}
          </Text>

          <View style={styles.planRow}>
            {switchablePlans.map((plan) => {
              const duration = (plan.duration ?? "").toLowerCase();
              const isLifetime = duration === "lifetime";
              const isYearly = duration === "year";
              const priceView = getPlanCardPriceView(plan.priceDisplay, duration);
              const originalPrice =
                priceView.hasStorePrice && (isLifetime || isYearly)
                  ? localizeCompareAtPriceDisplay(
                      getCompareAtPriceDisplay(
                        plan.id,
                        plan.priceDisplay,
                        storePrices
                      )
                    )
                  : null;

              return (
                <PostAuthHorizontalPlanCard
                  key={plan.id}
                  title={getSwitchOptionCardTitle(
                    duration,
                    currentPlanKind,
                    getPlanDisplayTitle(duration, plan.title)
                  )}
                  priceAmount={priceView.amount}
                  priceSuffix={priceView.suffix}
                  billingNote={
                    !originalPrice ? priceView.billingNote : undefined
                  }
                  originalPrice={originalPrice}
                  duration={duration}
                  trialDays={getPlanCardTrialDays(duration, plan.trialDays)}
                  selected={selectedPlanId === plan.id}
                  onPress={() => setSelectedPlanId(plan.id as PlanId)}
                  colors={colors}
                />
              );
            })}
          </View>

          <View style={styles.infoBlock}>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              You&apos;re about to change your subscription. Don&apos;t
              worry—your data and settings will stay safe.{"\n\n"}
              Upgrades take effect immediately.{"\n\n"}
              Downgrades will apply at the end of your current billing cycle.
            </Text>
          </View>

          <PostAuthGradientButton
            title={ctaLabel}
            onPress={() => {
              if (!selectedPlanId) return;
              void onSubscribe(selectedPlanId);
            }}
            loading={isPurchasing}
            disabled={
              isPurchasing ||
              isDowngrading ||
              isLoadingPrices ||
              !selectedPlanId ||
              isSelectedCurrentPlan
            }
            colors={colors}
          />

          <TouchableOpacity
            onPress={handleDowngrade}
            style={styles.downgradeButton}
            disabled={isPurchasing || isDowngrading}
          >
            <Text style={[styles.downgradeText, { color: colors.textPrimary }]}>
              {isDowngrading ? "Processing…" : "Downgrade to Free Plan"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
  backdropPress: {
    flex: 1,
  },
  sheet: {
    backgroundColor: SHEET_SURFACE,
    borderTopLeftRadius: SHEET_TOP_RADIUS,
    borderTopRightRadius: SHEET_TOP_RADIUS,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    overflow: "hidden",
    paddingHorizontal: POST_AUTH_LAYOUT.horizontalPadding,
    paddingTop: 16,
    gap: 24,
  },
  headerRow: {
    minHeight: 24,
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
  },
  closeButton: {
    width: 24,
    height: 24,
    borderRadius: 24,
    backgroundColor: "#F6F6F6",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 24,
    lineHeight: 32,
    textAlign: "center",
    width: "100%",
  },
  planRow: {
    ...HORIZONTAL_PLAN_ROW_STYLE,
    gap: 12,
  },
  infoBlock: {
    width: "100%",
  },
  infoText: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  downgradeButton: {
    alignSelf: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  downgradeText: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    lineHeight: 20,
    textDecorationLine: "underline",
  },
});
