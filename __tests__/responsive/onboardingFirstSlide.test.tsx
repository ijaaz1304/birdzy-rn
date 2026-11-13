import React from "react";
import { act, create, ReactTestRenderer } from "react-test-renderer";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { OnboardingPage } from "../../src/features/onboarding/components/OnboardingPage";
import { ThemeContext } from "../../src/app/ThemeProvider";
import { themes } from "../../src/design-system/themes";

let mockWindow = { width: 393, height: 852, fontScale: 1, scale: 3 };
jest.mock("react-native/Libraries/Utilities/useWindowDimensions", () => ({
  __esModule: true,
  default: () => mockWindow,
}));
jest.mock("../../src/components/AppImage", () => ({
  AppImage: "AppImage",
  CachedRemoteImage: "CachedRemoteImage",
}));
jest.mock("../../src/features/onboarding/components/ChatInterface", () => ({
  ChatInterface: () => null,
}));
jest.mock("../../src/features/onboarding/components/PaginationDots", () => ({
  PaginationDots: () => null,
}));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 47, bottom: 34, left: 0, right: 0 }),
}));
jest.mock("react-native-vector-icons/Ionicons", () => "Ionicons");
jest.mock("react-native-vector-icons/Feather", () => "Feather");
jest.mock("react-native-vector-icons/MaterialIcons", () => "MaterialIcons");
jest.mock("react-native-vector-icons/MaterialCommunityIcons", () => "MaterialCommunityIcons");

const firstSlide = {
  id: "1",
  title: "Discover thousands of birds like never before",
  description:
    "Scan with AI, explore a vast birdabase, and connect with a nature-loving community,",
  backgroundImage: 1,
};

let tree: ReactTestRenderer;
const render = async (width: number, height: number, fontScale: number) => {
  mockWindow = { width, height, fontScale, scale: 3 };
  await act(async () => {
    tree = create(
      <ThemeContext.Provider
        value={{ theme: themes.light, themeMode: "light", setThemeMode: jest.fn() } as never}
      >
        <OnboardingPage
          data={firstSlide as never}
          width={width}
          pageIndex={0}
          topReserve={119}
          bottomReserve={90}
        />
      </ThemeContext.Provider>
    );
  });
};
const copy = () =>
  tree.root
    .findAllByType(ScrollView)
    .find((node) => node.props.testID === "onboarding-copy")!;
const title = () =>
  tree.root
    .findAllByType(Text)
    .find((node) => node.props.children === firstSlide.title)!;

afterEach(async () => {
  if (tree) await act(async () => tree.unmount());
});

const column = () => StyleSheet.flatten(copy().props.contentContainerStyle);
/** Top of the copy scroll band (below the illustration / Skip bar). */
const copyTop = () => StyleSheet.flatten(copy().props.style).top as number;
/** Bird illustration bottom (art y=432 of 375×813), bottom-anchored and scaled. */
const birdBottom = (w: number, h: number) => {
  const artHeight = 375 * (3252 / 1500);
  const scale = Math.max(h, w * (3252 / 1500)) / artHeight;
  return h - (artHeight - 432) * scale;
};

test.each([
  [360, 800],
  [393, 852],
  [430, 932],
])("default text keeps the Figma 24pt title in a flex column on %ix%i", async (w, h) => {
  await render(w, h, 1);
  expect(StyleSheet.flatten(title().props.style).fontSize).toBe(24);
  // Flex layout between the measured chrome — no absolute y positioning.
  expect(StyleSheet.flatten(copy().props.style).position).toBe("absolute");
  expect(column().flexGrow).toBe(1);
  // Copy never rises above the bird illustration (or the Skip bar).
  expect(copyTop()).toBeCloseTo(Math.max(119, birdBottom(w, h)) + 16);
  // Scroll area ends at the measured Next section; Figma's 64pt gap sits inside it,
  // so overflowing copy is clipped above Next instead of drawing underneath it.
  expect(StyleSheet.flatten(copy().props.style).bottom).toBe(90);
  expect(column().paddingBottom).toBe(64);
});

test("large text keeps the Figma layout (no fallback) and grows inside the scrollable column", async () => {
  await render(360, 640, 2);
  // Same Figma typography; the OS font scale is applied natively.
  expect(StyleSheet.flatten(title().props.style).fontSize).toBe(24);
  expect(title().props.numberOfLines).toBeUndefined();
  expect(column().flexGrow).toBe(1);
  expect(copy().props.scrollEnabled).not.toBe(false);
  // The stacked fallback with its own Sign up / Log in buttons is not used.
  const labels = tree.root.findAllByType(Text).map((n) => n.props.children);
  expect(labels).not.toContain("Sign up");
});

test("largest text on Pixel 9 (411x923) keeps the copy below the bird and scrolls instead", async () => {
  await render(411, 923, 2);
  expect(copyTop()).toBeCloseTo(birdBottom(411, 923) + 16);
  expect(copyTop()).toBeGreaterThan(119 + 16);
});

test("slide 2 keeps the copy below the bird cards (art y=495) at the largest text", async () => {
  mockWindow = { width: 411, height: 923, fontScale: 2, scale: 3 };
  await act(async () => {
    tree = create(
      <ThemeContext.Provider
        value={{ theme: themes.light, themeMode: "light", setThemeMode: jest.fn() } as never}
      >
        <OnboardingPage
          data={{ ...firstSlide, id: "2", title: "Browse a vast collection of birds." } as never}
          width={411}
          pageIndex={1}
          topReserve={119}
          bottomReserve={90}
        />
      </ThemeContext.Provider>
    );
  });
  const artHeight = 375 * (3252 / 1500);
  const scale = Math.max(923, 411 * (3252 / 1500)) / artHeight;
  expect(copyTop()).toBeCloseTo(923 - (artHeight - 495) * scale + 16);
});

test.each([
  [2, 465],
  [3, 438],
])("slide %i keeps the copy below its illustration (art y=%i) at the largest text", async (pageIndex, artBottom) => {
  mockWindow = { width: 411, height: 923, fontScale: 2, scale: 3 };
  await act(async () => {
    tree = create(
      <ThemeContext.Provider
        value={{ theme: themes.light, themeMode: "light", setThemeMode: jest.fn() } as never}
      >
        <OnboardingPage
          data={{ ...firstSlide, id: String(pageIndex + 1) } as never}
          width={411}
          pageIndex={pageIndex}
          topReserve={119}
          bottomReserve={90}
        />
      </ThemeContext.Provider>
    );
  });
  const artHeight = 375 * (3252 / 1500);
  const scale = Math.max(923, 411 * (3252 / 1500)) / artHeight;
  expect(copyTop()).toBeCloseTo(923 - (artHeight - artBottom) * scale + 16);
});

test("copy column is capped at the 393pt base frame column on large phones", async () => {
  await render(430, 932, 1);
  const stack = tree.root
    .findAllByType(View)
    .find((n) => StyleSheet.flatten(n.props.style)?.maxWidth === 353);
  expect(stack).toBeDefined();
  expect(StyleSheet.flatten(stack!.props.style).width).toBe("100%");
});

test.each([
  [360, 640, 2],
  [411, 923, 1],
])("sign-up slide keeps the Figma layout at %ix%i font %d (no fallback) inside a scrollable column", async (w, h, fs) => {
  mockWindow = { width: w, height: h, fontScale: fs, scale: 3 };
  await act(async () => {
    tree = create(
      <ThemeContext.Provider
        value={{ theme: themes.light, themeMode: "light", setThemeMode: jest.fn() } as never}
      >
        <OnboardingPage
          data={{ id: "5", title: "Keep track of\nyour bird journey", description: "Sign up and log in", illustration: "authProgress" } as never}
          width={w}
          pageIndex={4}
          onSignUp={jest.fn()}
          onLogIn={jest.fn()}
          onContinueAsGuest={jest.fn()}
        />
      </ThemeContext.Provider>
    );
  });
  const scroll = tree.root
    .findAllByType(ScrollView)
    .find((n) => n.props.testID === "onboarding-auth-scroll")!;
  expect(scroll).toBeDefined();
  expect(StyleSheet.flatten(scroll.props.contentContainerStyle).flexGrow).toBe(1);
  const authTitle = tree.root
    .findAllByType(Text)
    .find((n) => String(n.props.children).startsWith("Keep track"))!;
  // Figma Title/28px/Bold at every size; OS font scale applied natively; no weight (Android Roboto fallback).
  const titleStyle = StyleSheet.flatten(authTitle.props.style);
  expect(titleStyle.fontSize).toBe(28);
  expect(titleStyle.fontWeight).toBeUndefined();
  const labels = tree.root.findAllByType(Text).map((n) => n.props.children);
  expect(labels).toEqual(expect.arrayContaining(["Sign up", "Log in", "Continue as guest"]));
  // Bird circle keeps a minimum size instead of collapsing.
  const birds = tree.root
    .findAllByType(View)
    .find((n) => StyleSheet.flatten(n.props.style)?.minHeight === 120);
  expect(birds).toBeDefined();
});

test("title is sized to the lines Android actually draws (no blank line when a line only just fits)", async () => {
  await render(316, 710, 1.3);
  // Native measurement can over-count (3 lines) while 2 lines are drawn.
  await act(async () =>
    title().props.onTextLayout({
      nativeEvent: {
        lines: [
          { text: "Discover thousands of ", height: 32, width: 282 },
          { text: "birds like never before", height: 32, width: 276 },
        ],
      },
    })
  );
  expect(StyleSheet.flatten(title().props.style).height).toBe(64);
  // Re-wrapping (e.g. larger font) grows it again.
  await act(async () =>
    title().props.onTextLayout({
      nativeEvent: {
        lines: [
          { text: "Discover ", height: 40, width: 150 },
          { text: "thousands of ", height: 40, width: 220 },
          { text: "birds like never before", height: 40, width: 270 },
        ],
      },
    })
  );
  expect(StyleSheet.flatten(title().props.style).height).toBe(120);
});
