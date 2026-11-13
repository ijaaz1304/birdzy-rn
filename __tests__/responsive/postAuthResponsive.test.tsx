import React from "react";
import { act, create, ReactTestRenderer } from "react-test-renderer";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
  getPostAuthPlanLayout,
  POST_AUTH_PLAN_CARD_MIN_WIDTH,
} from "../../src/features/post-auth-onboarding/utils/postAuthLayout";
import { PostAuthHorizontalPlanCard } from "../../src/features/post-auth-onboarding/components/PostAuthHorizontalPlanCard";
import { PostAuthLocationAccessSlide } from "../../src/features/post-auth-onboarding/components/PostAuthLocationAccessSlide";
import { ThemeContext } from "../../src/app/ThemeProvider";
import { themes } from "../../src/design-system/themes";

jest.mock("../../src/components/AppImage", () => ({
  AppImage: "AppImage",
  CachedRemoteImage: "CachedRemoteImage",
}));
jest.mock("react-native-linear-gradient", () => ({
  __esModule: true,
  default: ({ children, ...props }: any) =>
    require("react").createElement(require("react-native").View, props, children),
}));
jest.mock("@react-native-community/blur", () => ({ BlurView: () => null }));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 47, bottom: 34, left: 0, right: 0 }),
}));
jest.mock("../../src/features/post-auth-onboarding/utils/theme", () => ({
  usePostAuthOnboardingIsDark: () => false,
}));
jest.mock("../../src/utils/tabletLayout", () => ({
  isTabletDevice: () => false,
}));
jest.mock("../../src/hooks/useStrings", () => ({
  useStrings: () => ({
    camera: { galleryLocationAccess: { title: "t", subtitle: "s", continue: "c" } },
  }),
}));
jest.mock("react-native-vector-icons/Feather", () => "Feather");
jest.mock("react-native-vector-icons/MaterialIcons", () => "MaterialIcons");
jest.mock("react-native-vector-icons/MaterialCommunityIcons", () => "MaterialCommunityIcons");
jest.mock("react-native-vector-icons/Ionicons", () => "Ionicons");

let tree: ReactTestRenderer;
afterEach(async () => {
  if (tree) await act(async () => tree.unmount());
});
const wrap = (el: React.ReactElement) => (
  <ThemeContext.Provider
    value={{ theme: themes.light, themeMode: "light", setThemeMode: jest.fn() } as never}
  >
    {el}
  </ThemeContext.Provider>
);

describe("plan cards: Figma row of 3 when readable, stacked otherwise", () => {
  test.each([
    // [content width, font scale, expected]
    [335, 1, "row"], // 375 frame
    [353, 1, "row"], // 393 base frame
    [390, 1, "row"], // 430 frame
    [320, 1, "row"], // 360 small frame
    [320, 1.15, "row"],
    [276, 1, "column"], // ~316dp window (largest display size)
    [335, 1.3, "column"], // larger text
    [335, 2, "column"],
  ] as const)("width %i, font %d → %s", (w, fs, expected) => {
    expect(getPostAuthPlanLayout(w, fs, 3)).toBe(expected);
  });

  test("a single plan never uses the row", () => {
    expect(getPostAuthPlanLayout(390, 1, 1)).toBe("column");
  });

  test("row needs every card to keep the minimum readable width", () => {
    const needed = 3 * POST_AUTH_PLAN_CARD_MIN_WIDTH + 2 * 8;
    expect(getPostAuthPlanLayout(needed, 1, 3)).toBe("row");
    expect(getPostAuthPlanLayout(needed - 1, 1, 3)).toBe("column");
  });
});

test("row card takes an equal share and the Popular badge overlaps the top border", async () => {
  await act(async () => {
    tree = create(
      <PostAuthHorizontalPlanCard
        title="Yearly"
        priceAmount="$5.0"
        priceSuffix="/year"
        duration="year"
        trialDays={7}
        showPopular
        selected
        onPress={jest.fn()}
        layout="row"
      />
    );
  });
  const outer = tree.root.findAll(
    (n) => n.props.accessibilityRole === "button" && typeof n.props.style === "function"
  )[0];
  const outerStyle = StyleSheet.flatten(outer.props.style({ pressed: false }));
  expect(outerStyle.flex).toBe(1);
  const badge = tree.root
    .findAllByType(View)
    .find((n) => StyleSheet.flatten(n.props.style)?.top === -8);
  expect(badge).toBeDefined();
  expect(StyleSheet.flatten(badge!.props.style).position).toBe("absolute");
  // Text is never truncated or shrunk.
  for (const t of tree.root.findAllByType(Text)) {
    expect(t.props.numberOfLines).toBeUndefined();
    expect(t.props.adjustsFontSizeToFit).not.toBe(true);
  }
});

test("column card (paywall / switch-plan sheet) keeps its stacked layout", async () => {
  await act(async () => {
    tree = create(
      <PostAuthHorizontalPlanCard
        title="Yearly"
        priceAmount="$5.0"
        priceSuffix="/year"
        showPopular
        selected={false}
        onPress={jest.fn()}
      />
    );
  });
  const badge = tree.root
    .findAllByType(View)
    .find((n) => StyleSheet.flatten(n.props.style)?.top === -8);
  expect(badge).toBeUndefined();
});

describe("location / notification permission slide", () => {
  const renderSlide = async () => {
    await act(async () => {
      tree = create(
        wrap(
          <PostAuthLocationAccessSlide
            onContinue={jest.fn()}
            textPrimary="#111111"
            textSecondary="#5D5D5D"
            primaryColor="#402122"
            onPrimaryColor="#FFFFFF"
            title="Enable Location Access"
            subtitle="Our identification accuracy exceeds 90% with location access"
            heroDesignSize={{ width: 335, height: 313 }}
            continueLabel="Allow"
            secondaryLabel="Maybe later"
            onSecondaryPress={jest.fn()}
          />
        )
      );
    });
  };
  const textNode = (label: string) =>
    tree.root.findAllByType(Text).find((n) => n.props.children === label)!;

  test("Figma typography with no fontWeight (Android Roboto fallback) and #111 title", async () => {
    await renderSlide();
    const title = StyleSheet.flatten(textNode("Enable Location Access").props.style);
    expect(title.fontSize).toBe(28);
    expect(title.lineHeight).toBe(36);
    expect(title.fontWeight).toBeUndefined();
    expect(title.color).toBe("#111111");
    const body = StyleSheet.flatten(
      textNode("Our identification accuracy exceeds 90% with location access").props.style
    );
    expect(body.fontSize).toBe(16);
    expect(body.fontWeight).toBeUndefined();
    expect(StyleSheet.flatten(textNode("Allow").props.style).fontWeight).toBeUndefined();
  });

  test("illustration can shrink to 120pt before the page scrolls; CTA is 44pt minimum", async () => {
    await renderSlide();
    const heroWrap = tree.root
      .findAllByType(View)
      .find((n) => typeof n.props.onLayout === "function");
    expect(StyleSheet.flatten(heroWrap!.props.style).minHeight).toBe(120);
    const cta = tree.root
      .findAllByType(TouchableOpacity)
      .find((n) => n.props.onPress && StyleSheet.flatten(n.props.style).minHeight === 44);
    expect(StyleSheet.flatten(cta!.props.style).paddingVertical).toBe(10);
  });

  test("title is sized to the lines actually drawn (no blank line)", async () => {
    await renderSlide();
    await act(async () =>
      textNode("Enable Location Access").props.onTextLayout({
        nativeEvent: { lines: [{ text: "Enable Location Access", height: 36, width: 300 }] },
      })
    );
    expect(StyleSheet.flatten(textNode("Enable Location Access").props.style).height).toBe(36);
  });
});

