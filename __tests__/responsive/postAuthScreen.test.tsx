import React from "react";
import { act, create, ReactTestRenderer } from "react-test-renderer";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ThemeContext } from "../../src/app/ThemeProvider";
import { themes } from "../../src/design-system/themes";

let mockSlide = 2;
let mockWindow = { width: 393, height: 852, fontScale: 1, scale: 3 };
const mockPlans = [
  { id: "monthly_birdzy_pack", duration: "month", title: "Monthly", priceDisplay: "$2.5", trialDays: 3 },
  { id: "yearly_birdzy_pack", duration: "year", title: "Yearly", priceDisplay: "$5.0", trialDays: 7 },
  { id: "lifetime_birdzy_pack", duration: "lifetime", title: "Life-time", priceDisplay: "$7.5" },
];

jest.mock("react-native/Libraries/Utilities/useWindowDimensions", () => ({
  __esModule: true,
  default: () => mockWindow,
}));
jest.mock("../../src/components/AppImage", () => ({ AppImage: "AppImage", CachedRemoteImage: "CachedRemoteImage" }));
jest.mock("../../src/assets", () => ({ Images: new Proxy({}, { get: () => 1 }) }));
jest.mock("../../src/features/post-auth-onboarding/utils/background", () => ({
  PostAuthOnboardingBackground: () => null,
}));
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 47, bottom: 34, left: 0, right: 0 }),
}));
jest.mock("react-native-linear-gradient", () => ({
  __esModule: true,
  default: ({ children, ...props }: any) =>
    require("react").createElement(require("react-native").View, props, children),
}));
jest.mock("@react-native-community/blur", () => ({ BlurView: () => null }));
jest.mock("../../src/utils/tabletLayout", () => ({ isTabletDevice: () => false }));
jest.mock("../../src/features/post-auth-onboarding/utils/theme", () => ({
  usePostAuthOnboardingIsDark: () => false,
}));
jest.mock("../../src/services/permissions/permission.service", () => ({ requestNotificationPermission: jest.fn() }));
jest.mock("../../src/services/permissions/permissionPromptSkip", () => ({ markNotificationPermissionPrompted: jest.fn() }));
jest.mock("../../src/services/permissions", () => ({ checkLocationPermission: jest.fn() }));
jest.mock("../../src/services/permissions/locationPermissionFlow.service", () => ({ requestNativeLocationPermission: jest.fn() }));
jest.mock("../../src/features/camera/useIdentificationLocation", () => ({
  useIdentificationLocation: () => ({ syncPermission: jest.fn() }),
}));
jest.mock("../../src/hooks/usePushNotifications", () => ({
  usePushNotifications: () => ({ registerDevice: jest.fn() }),
}));
jest.mock("../../src/features/auth/auth.store", () => ({
  useAuthStore: (sel: any) => sel({ token: "t", user: { isSubscribed: false } }),
}));
jest.mock("../../src/features/subscription/hooks/useIapPurchase", () => ({
  useIapPurchase: () => ({ purchasePlan: jest.fn(), isPurchasing: false, restorePurchases: jest.fn(), isRestoring: false }),
}));
jest.mock("../../src/services/analytics/analytics.service", () => ({ analyticsService: { logEvent: jest.fn() } }));
jest.mock("../../src/services/analytics/packAnalytics", () => ({ logBirdzyPackEvent: jest.fn() }));
jest.mock("../../src/features/subscription/hooks/useSubscriptionPlansWithPrices", () => ({
  useSubscriptionPlansWithPrices: () => ({
    plans: mockPlans, isLoadingPrices: false, priceLoadError: null, refetchPrices: jest.fn(), storePrices: {},
  }),
}));
jest.mock("../../src/features/subscription/subscription.store", () => {
  const state = { syncFromAuthStore: () => undefined, setPendingWelcomeModal: () => undefined, pendingWelcomeModal: false };
  const useSubscriptionStore: any = (sel: any) => sel(state);
  useSubscriptionStore.getState = () => state;
  return { useSubscriptionStore, selectIsPremium: () => false };
});
jest.mock("../../src/features/post-auth-onboarding/post-auth-onboarding.store", () => ({
  usePostAuthOnboardingStore: (sel: any) =>
    sel({ setCurrentSlide: jest.fn(), markCompleted: jest.fn(), currentSlide: mockSlide, _hasHydrated: true }),
}));
jest.mock("../../src/features/post-auth-onboarding/utils/postAuthSlideResolution", () => ({
  resolvePostAuthOnboardingSlide: async (s: number) => ({ kind: "slide", slide: s }),
}));
jest.mock("../../src/features/post-auth-onboarding/components/PostAuthSubscriptionFeatureCarousel", () => ({
  PostAuthSubscriptionFeatureCarousel: () => null,
}));
jest.mock("../../src/features/post-auth-onboarding/components/PostAuthDiscountTimerPill", () => ({
  PostAuthDiscountTimerPill: () => null,
}));
jest.mock("../../src/features/post-auth-onboarding/components/PostAuthLegalModal", () => ({ PostAuthLegalModal: () => null }));
jest.mock("../../src/molecules/Modal", () => ({ SubscriptionSuccessModal: () => null }));
jest.mock("react-native-vector-icons/Feather", () => "Feather");
jest.mock("react-native-vector-icons/MaterialIcons", () => "MaterialIcons");
jest.mock("react-native-vector-icons/MaterialCommunityIcons", () => "MaterialCommunityIcons");
jest.mock("react-native-vector-icons/Ionicons", () => "Ionicons");

import { PostAuthOnboardingScreen } from "../../src/features/post-auth-onboarding/screens/PostAuthOnboardingScreen";

let tree: ReactTestRenderer;
afterEach(async () => {
  if (tree) await act(async () => tree.unmount());
});
const renderAt = async (slide: number, window = { width: 393, height: 852, fontScale: 1 }) => {
  mockSlide = slide;
  mockWindow = { ...window, scale: 3 };
  await act(async () => {
    tree = create(
      <ThemeContext.Provider
        value={{ theme: themes.light, themeMode: "light", setThemeMode: jest.fn() } as never}
      >
        <PostAuthOnboardingScreen />
      </ThemeContext.Provider>
    );
  });
};
const texts = () => tree.root.findAllByType(Text).map((n) => n.props.children);
const planRow = () =>
  tree.root
    .findAllByType(View)
    .find((n) => {
      const st = StyleSheet.flatten(n.props.style);
      return st && (st.flexDirection === "row" || st.flexDirection === "column") && st.paddingTop === 8 && st.gap === 8;
    })!;

describe("subscription slide (Figma 8015:131512)", () => {
  test("plans sit in one row of 3 on a standard phone; Later link under the CTA", async () => {
    await renderAt(2);
    expect(StyleSheet.flatten(planRow().props.style).flexDirection).toBe("row");
    expect(texts()).toContain("Later");
    expect(texts()).toContain("Skip");
  });

  test("Later goes to the surprise slide (same as Skip)", async () => {
    await renderAt(2);
    const later = tree.root
      .findAllByType(TouchableOpacity)
      .find((n) => n.findAllByType(Text).some((t) => t.props.children === "Later"))!;
    await act(async () => later.props.onPress());
    expect(texts()).toContain("We got a little surprise for you!");
  });

  test.each([
    ["larger text", { width: 393, height: 852, fontScale: 1.3 }],
    ["largest display size (~316dp)", { width: 316, height: 710, fontScale: 1 }],
  ])("plans stack on %s", async (_, window) => {
    await renderAt(2, window);
    expect(StyleSheet.flatten(planRow().props.style).flexDirection).toBe("column");
  });
});

describe("surprise slide (Figma 8015:131692)", () => {
  test("title wraps naturally (no forced break), Figma #111, no fontWeight", async () => {
    await renderAt(3);
    const title = tree.root
      .findAllByType(Text)
      .find((n) => n.props.children === "We got a little surprise for you!")!;
    const st = StyleSheet.flatten(title.props.style);
    expect(st.fontSize).toBe(28);
    expect(st.fontWeight).toBeUndefined();
    expect(st.color).toBe("#111111");
  });

  test("gift scales with the free space between 120pt and its Figma size", async () => {
    await renderAt(3);
    const gift = tree.root.findAll((n) => (n.type as any) === "AppImage")[0];
    const st = StyleSheet.flatten(gift.props.style);
    expect(st).toMatchObject({ width: "100%", height: "100%", maxWidth: 273, maxHeight: 280 });
    expect(StyleSheet.flatten(gift.parent!.props.style).minHeight).toBe(120);
    expect(texts()).toContain("Open it");
  });
});

test("each slide starts scrolled to the top (scroll position does not carry over)", async () => {
  const { ScrollView } = require("react-native");
  await renderAt(2);
  const before = tree.root.findAllByType(ScrollView)[0].instance;
  const later = tree.root
    .findAllByType(TouchableOpacity)
    .find((n) => n.findAllByType(Text).some((t) => t.props.children === "Later"))!;
  await act(async () => later.props.onPress());
  const after = tree.root.findAllByType(ScrollView)[0].instance;
  // New slide → new scroll container (fresh offset 0), not the paywall's scrolled one.
  expect(after).not.toBe(before);
});

describe("discount slide (Figma 8327:72643)", () => {
  test("Figma content: header, Skip, plans in a row, no Later link; Bold 12/16 legal links", async () => {
    await renderAt(4);
    expect(texts()).toEqual(expect.arrayContaining(["Especially for you!", "Skip", "Terms of Service", "Privacy Policy"]));
    expect(texts()).not.toContain("Later");
    expect(StyleSheet.flatten(planRow().props.style).flexDirection).toBe("row");
    const terms = tree.root.findAllByType(Text).find((n) => n.props.children === "Terms of Service")!;
    const st = StyleSheet.flatten(terms.props.style);
    expect(st.fontSize).toBe(12);
    expect(st.lineHeight).toBe(16);
    expect(st.fontFamily).toBe("Satoshi-Bold");
  });

  test("larger text: plans stack and header copy is sized to its drawn lines", async () => {
    await renderAt(4, { width: 393, height: 852, fontScale: 1.3 });
    expect(StyleSheet.flatten(planRow().props.style).flexDirection).toBe("column");
    const title = tree.root.findAllByType(Text).find((n) => n.props.children === "Especially for you!")!;
    await act(async () =>
      title.props.onTextLayout({ nativeEvent: { lines: [{ text: "Especially for you!", height: 47, width: 300 }] } })
    );
    const updated = tree.root.findAllByType(Text).find((n) => n.props.children === "Especially for you!")!;
    expect(StyleSheet.flatten(updated.props.style).height).toBe(47);
  });
});
