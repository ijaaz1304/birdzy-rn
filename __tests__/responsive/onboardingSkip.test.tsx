import React from "react";
import { act, create, ReactTestRenderer } from "react-test-renderer";
import { StyleSheet, TouchableOpacity } from "react-native";
import { useRoute } from "@react-navigation/native";
import { ThemeContext } from "../../src/app/ThemeProvider";
import { themes } from "../../src/design-system/themes";

const pages = [
  { title: "Discover thousands of birds like never before", subtitle: "a" },
  { title: "Browse a vast collection of birds.", subtitle: "b" },
  { title: "Curate your own bird collections.", subtitle: "c" },
  { title: "Identify birds by sound.", subtitle: "d" },
  { title: "Keep track of\nyour bird journey", subtitle: "e" },
];

jest.mock("../../src/features/onboarding/components/OnboardingPage", () => ({
  OnboardingPage: () => null,
}));
jest.mock("../../src/molecules/ScreenContainer/ScreenContainer", () => ({
  ScreenContainer: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock("../../src/config/context", () => ({
  useFeatureConfig: () => ({
    pages,
    skipText: "Skip",
    continueText: "Next",
    getStartedText: "Get started",
    continueAsGuestText: "Continue as guest",
  }),
}));
jest.mock("../../src/features/onboarding/onboarding.store", () => ({
  useOnboardingStore: () => ({ setHasCompletedOnboarding: jest.fn() }),
}));
jest.mock("../../src/features/post-auth-onboarding", () => ({
  resetToPostAuthOnboarding: jest.fn(),
}));
jest.mock("../../src/features/auth/auth.store", () => ({
  useAuthStore: { getState: () => ({}) },
}));
jest.mock("../../src/hooks", () => ({ useToast: () => ({ showToast: jest.fn() }) }));
jest.mock("../../src/services/remoteConfig/remoteConfig.service", () => ({
  getRemoteConfigValue: () => undefined,
}));
jest.mock("../../src/components/AppLogsTooltip/AppLogsTooltip", () => ({
  TOOLTIP_ELIGIBLE_FOR_SIGNUP_KEY: "k",
}));
jest.mock("../../src/assets", () => ({ Images: new Proxy({}, { get: () => 1 }) }));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 47, bottom: 34, left: 0, right: 0 }),
}));
jest.mock("react-native-vector-icons/Feather", () => "Feather");
jest.mock("react-native-vector-icons/MaterialIcons", () => "MaterialIcons");
jest.mock("react-native-vector-icons/MaterialCommunityIcons", () => "MaterialCommunityIcons");
jest.mock("react-native-vector-icons/Ionicons", () => "Ionicons");

import { OnboardingScreenPhone } from "../../src/features/onboarding/screens/OnboardingScreenPhone";

let tree: ReactTestRenderer;
afterEach(async () => {
  if (tree) await act(async () => tree.unmount());
});

const renderAt = async (initialPage?: number) => {
  (useRoute as jest.Mock).mockReturnValue({
    params: initialPage == null ? {} : { initialPage },
  });
  await act(async () => {
    tree = create(
      <ThemeContext.Provider
        value={{ theme: themes.light, themeMode: "light", setThemeMode: jest.fn() } as never}
      >
        <OnboardingScreenPhone />
      </ThemeContext.Provider>
    );
  });
  return tree.root
    .findAllByType(TouchableOpacity)
    .find((n) => n.props.testID === "onboarding-skip")!;
};

test.each([0, 1, 2, 3])("Skip is visible and tappable on intro slide %i (incl. slide 4)", async (page) => {
  const skip = await renderAt(page);
  expect(skip).toBeDefined();
  expect(skip.props.disabled).toBe(false);
  expect(StyleSheet.flatten(skip.props.style).opacity).not.toBe(0);
  expect(skip.props.accessibilityElementsHidden).toBe(false);
});

test("Skip is hidden (but stays mounted for a stable top bar) on the sign-up slide", async () => {
  const skip = await renderAt(-1);
  expect(skip).toBeDefined();
  expect(skip.props.disabled).toBe(true);
  expect(StyleSheet.flatten(skip.props.style).opacity).toBe(0);
  expect(skip.props.accessibilityElementsHidden).toBe(true);
  expect(skip.props.importantForAccessibility).toBe("no-hide-descendants");
});
