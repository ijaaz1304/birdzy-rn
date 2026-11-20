import React from "react";
import { act, create, ReactTestRenderer } from "react-test-renderer";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { ThemeContext } from "../../src/app/ThemeProvider";
import { themes } from "../../src/design-system/themes";

jest.mock("../../src/components/AppImage", () => ({ AppImage: "AppImage", CachedRemoteImage: "CachedRemoteImage" }));
jest.mock("../../src/assets", () => ({ Images: new Proxy({}, { get: () => 1 }), PASSWORD_VISIBILITY_ICON_SIZE: 24 }));
jest.mock("react-native-svg", () => ({ __esModule: true, default: "Svg", Path: "Path" }));
jest.mock("react-native-vector-icons/Feather", () => "Feather");
jest.mock("react-native-vector-icons/Ionicons", () => "Ionicons");
jest.mock("react-native-vector-icons/FontAwesome5", () => "FontAwesome5");
jest.mock("react-native-vector-icons/MaterialIcons", () => "MaterialIcons");
jest.mock("react-native-vector-icons/MaterialCommunityIcons", () => "MaterialCommunityIcons");
jest.mock("react-native-gesture-handler", () => ({ GestureDetector: ({ children }: any) => children, Gesture: {} }));
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 47, bottom: 34, left: 0, right: 0 }),
}));
jest.mock("../../src/features/auth/auth.store", () => {
  const state: any = {
    login: jest.fn(), guestLogin: jest.fn(), forgotPassword: jest.fn(), resetPassword: jest.fn(),
    isLoading: false, error: null, setError: jest.fn(), setGuestId: jest.fn(), guestId: null, token: null,
  };
  const useAuthStore: any = () => state;
  useAuthStore.getState = () => state;
  return { useAuthStore, __state: state };
});
jest.mock("../../src/config/context", () => ({
  useFeatureConfig: (k: string) => require("../../src/config/birds.config").birdsAppConfig[k],
}));
jest.mock("../../src/features/post-auth-onboarding", () => ({ resetToPostAuthOnboarding: jest.fn() }));
jest.mock("../../src/services/remoteConfig/remoteConfig.service", () => ({ getRemoteConfigValue: () => undefined }));
jest.mock("../../src/hooks", () => ({ useToast: () => ({ showToast: jest.fn() }) }));
jest.mock("../../src/features/app-logs/app-logs.store", () => ({ useAppLogsStore: { getState: () => ({ info: jest.fn(), error: jest.fn() }) } }));
jest.mock("../../src/molecules", () => ({ ScreenContainer: ({ children }: any) => children }));
jest.mock("../../src/features/auth/components/AuthScreenBackground", () => ({
  AuthScreenBackground: () => null,
  AuthScreenStatusBar: () => null,
}));

import { LoginScreen } from "../../src/features/auth/screens/LoginScreen";
import { ForgotPasswordScreen } from "../../src/features/auth/screens/ForgotPasswordScreen";
import { CreateNewPasswordScreen } from "../../src/features/auth/screens/CreateNewPasswordScreen";

// Default font and display settings: Typography Build A keeps exact Figma sizes at font scale 1
// (React Native's Jest setup otherwise reports a font scale of 2).
jest.mock("react-native/Libraries/Utilities/useWindowDimensions", () => ({
  __esModule: true,
  default: () => ({ width: 393, height: 852, scale: 3, fontScale: 1 }),
}));

const nav = require("@react-navigation/native");
const store = require("../../src/features/auth/auth.store").__state;
const navObj = { navigate: jest.fn(), goBack: jest.fn(), dispatch: jest.fn(), canGoBack: () => true, getParent: jest.fn() };
let tree: ReactTestRenderer;
afterEach(async () => {
  if (tree) await act(async () => tree.unmount());
  store.error = null;
});
const render = async (el: React.ReactElement, params: any = {}) => {
  nav.useNavigation.mockReturnValue(navObj);
  nav.useRoute.mockReturnValue({ params });
  await act(async () => {
    tree = create(
      <ThemeContext.Provider value={{ theme: themes.light, themeMode: "light", setThemeMode: jest.fn() } as never}>
        {el}
      </ThemeContext.Provider>
    );
  });
};
const flat = (n: any) => StyleSheet.flatten(n.props.style) ?? {};
const byText = (label: string) =>
  tree.root.findAllByType(Text).find((n) => [n.props.children].flat().join("") === label)!;
const byId = (type: any, id: string) => tree.root.findAll((n) => n.type === type && n.props.testID === id)[0];
const box = (input: any) => {
  let p: any = input.parent;
  while (p && !(p.type === View && flat(p).borderWidth === 1)) p = p.parent;
  return p;
};
const expectField = (id: string) => {
  const b = flat(box(byId(TextInput, id)));
  expect(b.minHeight).toBe(48);
  expect(b.height).toBeUndefined();
  expect(flat(byId(TextInput, id))).toMatchObject({ fontSize: 16, fontFamily: "Satoshi-Regular" });
};
const expectCta = (id: string) => {
  const cta = byId(TouchableOpacity, id);
  expect(flat(cta)).toMatchObject({ minHeight: 44, paddingVertical: 10, marginTop: 16 });
  expect(flat(cta).height).toBeUndefined();
  expect(flat(cta.findByType(Text))).toMatchObject({ fontFamily: "Satoshi-Medium", fontSize: 16, lineHeight: 24 });
};
const expectTitle = (label: string) => {
  const t = byText(label);
  expect(t.props.numberOfLines).toBe(2);
  expect(flat(t)).toMatchObject({ fontSize: 20, lineHeight: 28, fontFamily: "Satoshi-Bold" });
  expect(flat(t).fontWeight).toBeUndefined();
};

describe("log in (Figma 8015:112752)", () => {
  test("form scrolls (no fixed layout that overflows at large text); title max 2 lines; 48pt fields; Sign in 44pt min", async () => {
    await render(<LoginScreen />);
    expect(tree.root.findAllByType(ScrollView).length).toBe(1);
    expectTitle("Log in to Birdzy");
    expectField("login-email-input");
    expectField("login-password-input");
    expectCta("login-submit");
    const forgot = byId(TouchableOpacity, "login-forgot-password");
    expect(flat(forgot)).toMatchObject({ minHeight: 28, marginTop: 16 });
    expect(flat(byText("Forgot password"))).toMatchObject({ fontSize: 14, lineHeight: 20, fontFamily: "Satoshi-Medium" });
    const footer = tree.root.findAllByType(View).find((n) => flat(n).minHeight === 44 && flat(n).flexWrap === "wrap");
    expect(footer).toBeDefined();
    const list = tree.root.findAllByType(View).find((n) => flat(n).gap === 16 && n.findAllByProps({ text: "Continue with Google" }).length > 0);
    expect(list).toBeDefined();
  });

  test("keyboard: Next moves email → password, Done signs in; a login error shows the shared error row", async () => {
    await render(<LoginScreen />);
    expect(byId(TextInput, "login-email-input").props.returnKeyType).toBe("next");
    const pw = byId(TextInput, "login-password-input");
    expect(pw.props.returnKeyType).toBe("done");
    await act(async () => byId(TextInput, "login-email-input").props.onChangeText("a@b.co"));
    await act(async () => byId(TextInput, "login-password-input").props.onChangeText("secret"));
    await act(async () => byId(TextInput, "login-password-input").props.onSubmitEditing());
    expect(store.login).toHaveBeenCalledWith("a@b.co", "secret");
    store.error = "Invalid email or password";
    await render(<LoginScreen />);
    const err = byText("Invalid email or password");
    expect(err.props.numberOfLines).toBeUndefined();
    expect(flat(err)).toMatchObject({ fontSize: 12, lineHeight: 16 });
    expect(flat(box(byId(TextInput, "login-password-input"))).borderColor).toBe((themes.light.colors as any).borderError);
  });
});

test("placeholders wrap (max 2 lines) so they are never clipped at large fonts; hidden once the user types", async () => {
  await render(<LoginScreen />);
  const ph = () => tree.root.findAllByType(Text).find((n) => n.props.children === "Enter your password");
  expect(ph()).toBeDefined();
  expect(ph()!.props.numberOfLines).toBe(2);
  expect(flat(ph()!)).toMatchObject({ fontSize: 16, lineHeight: 24 });
  expect(byId(TextInput, "login-password-input").props.placeholder).toBeUndefined();
  await act(async () => byId(TextInput, "login-password-input").props.onChangeText("x"));
  expect(ph()).toBeUndefined();
});

describe("forgot password (Figma 8015:114316)", () => {
  test("title max 2 lines, subtitle wraps fully; 48pt field; Send reset link 44pt min, inline 16pt below the field", async () => {
    await render(<ForgotPasswordScreen />);
    expectTitle("Forgot password");
    const sub = tree.root.findAllByType(Text).find((n) => String(n.props.children).startsWith("Please enter the e-mail"))!;
    expect(sub.props.numberOfLines).toBeUndefined();
    expect(flat(sub)).toMatchObject({ fontSize: 14, lineHeight: 20 });
    expectField("forgot-email-input");
    expectCta("forgot-submit");
  });

  test("keyboard Send submits the email", async () => {
    await render(<ForgotPasswordScreen />);
    const input = () => byId(TextInput, "forgot-email-input");
    expect(input().props.returnKeyType).toBe("send");
    await act(async () => input().props.onChangeText("a@b.co"));
    await act(async () => input().props.onSubmitEditing());
    expect(store.forgotPassword).toHaveBeenCalledWith("a@b.co");
  });
});

describe("create a new password (Figma 8015:114341)", () => {
  test("title max 2 lines; two 48pt password fields; Save 44pt min; Next → Done saves", async () => {
    await render(<CreateNewPasswordScreen />, { email: "a@b.co", code: "123456" });
    expectTitle("Create a new password");
    expectField("new-password-input");
    expectField("confirm-new-password-input");
    expectCta("new-password-save");
    expect(byId(TextInput, "new-password-input").props.returnKeyType).toBe("next");
    await act(async () => byId(TextInput, "new-password-input").props.onChangeText("Abcdefg1"));
    await act(async () => byId(TextInput, "confirm-new-password-input").props.onChangeText("Abcdefg1"));
    await act(async () => byId(TextInput, "confirm-new-password-input").props.onSubmitEditing());
    expect(store.resetPassword).toHaveBeenCalledWith("123456", "Abcdefg1", "a@b.co");
  });
});
