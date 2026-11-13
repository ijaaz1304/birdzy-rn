import React from "react";
import { act, create, ReactTestRenderer } from "react-test-renderer";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ThemeContext } from "../../src/app/ThemeProvider";
import { themes } from "../../src/design-system/themes";

jest.mock("../../src/components/AppImage", () => ({ AppImage: "AppImage", CachedRemoteImage: "CachedRemoteImage" }));
jest.mock("../../src/assets", () => ({ Images: new Proxy({}, { get: () => 1 }) }));
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 47, bottom: 34, left: 0, right: 0 }),
}));
jest.mock("react-native-vector-icons/FontAwesome5", () => "FontAwesome5");
jest.mock("react-native-vector-icons/Ionicons", () => "Ionicons");
jest.mock("react-native-vector-icons/Feather", () => "Feather");
jest.mock("react-native-vector-icons/MaterialIcons", () => "MaterialIcons");
jest.mock("react-native-vector-icons/MaterialCommunityIcons", () => "MaterialCommunityIcons");
jest.mock("../../src/features/auth/auth.store", () => {
  const state = { guestLogin: jest.fn(), guestId: null, isLoading: false, setError: jest.fn(), setGuestId: jest.fn(), token: null };
  const useAuthStore: any = () => state;
  useAuthStore.getState = () => state;
  return { useAuthStore };
});
jest.mock("../../src/features/post-auth-onboarding", () => ({ resetToPostAuthOnboarding: jest.fn() }));
jest.mock("../../src/services/remoteConfig/remoteConfig.service", () => ({ getRemoteConfigValue: () => undefined }));
jest.mock("../../src/hooks", () => ({ useToast: () => ({ showToast: jest.fn() }) }));
jest.mock("../../src/components/AppLogsTooltip/AppLogsTooltip", () => ({ TOOLTIP_ELIGIBLE_FOR_SIGNUP_KEY: "k" }));
jest.mock("../../src/molecules", () => ({ ScreenContainer: ({ children }: any) => children }));
jest.mock("../../src/molecules/Input/Input", () => ({ Input: () => null }));
jest.mock("../../src/atoms/PrimaryButton/PrimaryButton", () => ({ PrimaryButton: () => null }));
jest.mock("react-native-gesture-handler", () => ({ GestureDetector: ({ children }: any) => children, Gesture: {} }));
jest.mock("../../src/features/auth/components/AuthScreenBackground", () => ({
  AuthScreenBackground: () => null,
  AuthScreenStatusBar: () => null,
}));

import { AuthButton } from "../../src/features/auth/components/AuthScreen";
import { SignUpScreen } from "../../src/features/auth/screens/SignUpScreen";

let tree: ReactTestRenderer;
afterEach(async () => {
  if (tree) await act(async () => tree.unmount());
});
const wrap = (el: React.ReactElement) => (
  <ThemeContext.Provider value={{ theme: themes.light, themeMode: "light", setThemeMode: jest.fn() } as never}>
    {el}
  </ThemeContext.Provider>
);

test("auth button: Figma 44pt minimum (grows), Medium 16/24 label that wraps inside the button", async () => {
  await act(async () => {
    tree = create(wrap(<AuthButton icon="google" text="Continue with Google" color="#111" onPress={jest.fn()} />));
  });
  const btn = tree.root.findAllByType(TouchableOpacity)[0];
  const st = StyleSheet.flatten(btn.props.style);
  expect(st.minHeight).toBe(44);
  expect(st.height).toBeUndefined();
  expect(st.paddingVertical).toBe(10);
  expect(st.borderRadius).toBeCloseTo(23.789);
  const label = tree.root.findAllByType(Text).find((n) => n.props.children === "Continue with Google")!;
  const ls = StyleSheet.flatten(label.props.style);
  expect(ls).toMatchObject({ fontSize: 16, lineHeight: 24, fontFamily: "Satoshi-Medium", flexShrink: 1 });
  expect(label.props.numberOfLines).toBeUndefined();
});

describe("sign up screen (Figma 8015:111035)", () => {
  const render = async () => {
    await act(async () => {
      tree = create(wrap(<SignUpScreen />));
    });
  };
  const textNode = (label: string) => tree.root.findAllByType(Text).find((n) => n.props.children === label)!;

  test("title is Title/20 (20/28), max 2 lines", async () => {
    await render();
    const title = textNode("Sign up to Birdzy");
    const st = StyleSheet.flatten(title.props.style);
    expect(st.fontSize).toBe(20);
    expect(st.lineHeight).toBe(28);
    expect(st.fontWeight).toBeUndefined();
    expect(title.props.numberOfLines).toBe(2);
  });

  test("buttons sit in a 16pt-gap list; close is a 40pt button; Log in row is 44pt", async () => {
    await render();
    const list = tree.root.findAllByType(View).find((n) => StyleSheet.flatten(n.props.style)?.gap === 16);
    expect(list).toBeDefined();
    const close = tree.root.findAllByType(TouchableOpacity).find((n) => n.props.accessibilityLabel === "Close")!;
    expect(StyleSheet.flatten(close.props.style)).toMatchObject({ width: 40, height: 40 });
    const footerRow = tree.root
      .findAllByType(View)
      .find((n) => StyleSheet.flatten(n.props.style)?.minHeight === 44 && StyleSheet.flatten(n.props.style)?.flexWrap === "wrap");
    expect(footerRow).toBeDefined();
    expect(textNode("Log in")).toBeDefined();
  });
});
