/**
 * Routes premium users to status screen, free users to paywall.
 * Owns the post-purchase welcome modal so it survives paywall → status transition.
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  useSubscriptionStore,
  selectIsPremium,
} from "../subscription.store";
import { SubscriptionPaywallScreen } from "./SubscriptionPaywallScreen";
import { SubscriptionStatusScreen } from "./SubscriptionStatusScreen";
import { usePopParentStackOnBack } from "../../../hooks/usePopParentStackOnBack";
import { SubscriptionSuccessModal } from "../../../molecules/Modal";
import { useAuthStore } from "../../auth/auth.store";
import { NavigationService } from "../../../utils/navigation";

export const SubscriptionMainScreen: React.FC = () => {
  usePopParentStackOnBack();
  const isPremium = useSubscriptionStore(selectIsPremium);
  const pendingWelcomeModal = useSubscriptionStore((s) => s.pendingWelcomeModal);
  const setPendingWelcomeModal = useSubscriptionStore(
    (s) => s.setPendingWelcomeModal
  );
  const syncFromAuthStore = useSubscriptionStore((s) => s.syncFromAuthStore);
  const getProfile = useAuthStore((s) => s.getProfile);

  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const welcomeShownRef = useRef(false);

  useEffect(() => {
    if (!pendingWelcomeModal || !isPremium || welcomeShownRef.current) return;
    welcomeShownRef.current = true;
    setShowWelcomeModal(true);
  }, [pendingWelcomeModal, isPremium]);

  const handleWelcomeDismiss = useCallback(async () => {
    setShowWelcomeModal(false);
    setPendingWelcomeModal(false);
    welcomeShownRef.current = false;
    try {
      await getProfile();
      syncFromAuthStore();
      NavigationService.reset("MainTabs");
      NavigationService.resetToNested("MainTabs", "Home");
    } catch {
      NavigationService.reset("MainTabs");
      NavigationService.resetToNested("MainTabs", "Home");
    }
  }, [getProfile, setPendingWelcomeModal, syncFromAuthStore]);

  return (
    <>
      {isPremium ? <SubscriptionStatusScreen /> : <SubscriptionPaywallScreen />}
      <SubscriptionSuccessModal
        visible={showWelcomeModal}
        onDismiss={() => void handleWelcomeDismiss()}
      />
    </>
  );
};
