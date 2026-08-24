/**
 * Onboarding entry — routes iPad/tablet to a separate implementation so phone stays unchanged.
 */

import React, { useMemo } from "react";
import { useWindowDimensions } from "react-native";
import { isOnboardingTabletDevice } from "../onboardingTablet";
import { OnboardingScreenPhone } from "./OnboardingScreenPhone";
import { OnboardingScreenTablet } from "./OnboardingScreenTablet";

export type { OnboardingPageData } from "./OnboardingScreenPhone";

export const OnboardingScreen: React.FC = () => {
  const { width, height } = useWindowDimensions();
  const isTablet = useMemo(
    () => isOnboardingTabletDevice(width, height),
    [width, height]
  );

  if (isTablet) {
    return <OnboardingScreenTablet />;
  }
  return <OnboardingScreenPhone />;
};
