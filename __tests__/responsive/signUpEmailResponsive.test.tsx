import React from "react";
import { act, create, ReactTestRenderer } from "react-test-renderer";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { ThemeContext } from "../../src/app/ThemeProvider";
import { themes } from "../../src/design-system/themes";

jest.mock("../../src/components/AppImage", () => ({ AppImage: "AppImage", CachedRemoteImage: "CachedRemoteImage" }));
jest.mock("../../src/assets", () => ({ Images: new Proxy({}, { get: () => 1 }), PASSWORD_VISIBILITY_ICON_SIZE: 24 }));
jest.mock("react-native-svg", () => ({ __esModule: true, default: "Svg", Path: "Path" }));
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
  const state = { signup: jest.fn(), guestId: null, isLoading: false, error: null, setError: jest.fn(), token: null };
  const useAuthStore: any = () => state;
  useAuthStore.getState = () => state;
  return { useAuthStore };
});
jest.mock("../../src/features/post-auth-onboarding", () => ({ resetToPostAuthOnboarding: jest.fn() }));
jest.mock("../../src/services/remoteConfig/remoteConfig.service", () => ({ getRemoteConfigValue: () => undefined }));
jest.mock("../../src/hooks", () => ({ useToast: () => ({ showToast: jest.fn() }) }));
jest.mock("../../src/components/AppLogsTooltip/AppLogsTooltip", () => ({ TOOLTIP_ELIGIBLE_FOR_SIGNUP_KEY: "k" }));
jest.mock("../../src/molecules", () => ({ ScreenContainer: ({ children }: any) => children }));
jest.mock("react-native-gesture-handler", () => ({ GestureDetector: ({ children }: any) => children, Gesture: {} }));
jest.mock("../../src/features/auth/components/AuthScreenBackground", () => ({
  AuthScreenBackground: () => null,
  AuthScreenStatusBar: () => null,
}));

import { Input } from "../../src/molecules/Input/Input";
import { SignupEmailScreen } from "../../src/features/auth/screens/SignUpScreen";

let tree: ReactTestRenderer;
afterEach(async () => {
  if (tree) await act(async () => tree.unmount());
});
const wrap = (el: React.ReactElement) => (
  <ThemeContext.Provider value={{ theme: themes.light, themeMode: "light", setThemeMode: jest.fn() } as never}>
    {el}
  </ThemeContext.Provider>
);
const render = async (el: React.ReactElement) => {
  await act(async () => {
    tree = create(wrap(el));
  });
};
const flat = (n: any) => StyleSheet.flatten(n.props.style) ?? {};
const fieldBox = (input: any) => {
  let p = input.parent;
  while (p && !(p.type === View && flat(p).borderWidth === 1)) p = p.parent;
  return p;
};

test("shared field: minimum height (grows with font size), never a fixed height; forwards autoCapitalize", async () => {
  await render(<Input value="" onChangeText={jest.fn()} placeholder="Email" autoCapitalize="none" />);
  const input = tree.root.findByType(TextInput);
  const box = flat(fieldBox(input));
  expect(box.height).toBeUndefined();
  expect(box.minHeight).toBe(52);
  expect(input.props.autoCapitalize).toBe("none");
});

describe("sign up with email (Figma 8015:111097 / 111110 / 111123)", () => {
  const input = (id: string) => tree.root.findAll((n) => n.type === TextInput && n.props.testID === id)[0];
  const type = async (id: string, v: string) => {
    await act(async () => input(id).props.onChangeText(v));
  };
  const texts = () => tree.root.findAllByType(Text).map((n) => [n.props.children].flat().join(""));

  test("title Title/20 max 2 lines; fields 48pt min, Body/16 Regular; CTA 44pt min, Medium 16/24", async () => {
    await render(<SignupEmailScreen />);
    const title = tree.root.findAllByType(Text).find((n) => n.props.children === "Sign up with email")!;
    expect(title.props.numberOfLines).toBe(2);
    expect(flat(title)).toMatchObject({ fontSize: 20, lineHeight: 28 });
    expect(flat(title).fontWeight).toBeUndefined();
    for (const id of ["signup-email-input", "signup-password-input", "signup-confirm-input"]) {
      const box = flat(fieldBox(input(id)));
      expect(box.minHeight).toBe(48);
      expect(box.height).toBeUndefined();
      expect(flat(input(id))).toMatchObject({ fontSize: 16, fontFamily: "Satoshi-Regular" });
    }
    const cta = tree.root.findAll((n) => n.type === TouchableOpacity && n.props.testID === "signup-email-submit")[0];
    expect(flat(cta)).toMatchObject({ minHeight: 44, paddingVertical: 10, marginTop: 16 });
    expect(flat(cta).height).toBeUndefined();
    const label = cta.findByType(Text);
    expect(flat(label)).toMatchObject({ fontFamily: "Satoshi-Medium", fontSize: 16, lineHeight: 24 });
    expect(label.props.numberOfLines).toBeUndefined();
  });

  test("error states: red border + wrapping caption error (no line cap); CTA disabled until valid", async () => {
    await render(<SignupEmailScreen />);
    await type("signup-email-input", "dsadasd");
    await type("signup-password-input", "abc");
    await type("signup-confirm-input", "abd");
    const msgs = texts();
    expect(msgs).toContain("Hmm, that doesn’t look like a valid email.");
    expect(msgs.some((t) => t.startsWith("Password must be at least 8 characters"))).toBe(true);
    expect(msgs).toContain("Passwords do not match.");
    const errColor = (themes.light.colors as any).borderError;
    for (const id of ["signup-email-input", "signup-password-input", "signup-confirm-input"]) {
      expect(flat(fieldBox(input(id))).borderColor).toBe(errColor);
    }
    const errText = tree.root.findAllByType(Text).find((n) => n.props.children === "Passwords do not match.")!;
    expect(errText.props.numberOfLines).toBeUndefined();
    expect(flat(errText)).toMatchObject({ fontSize: 12, lineHeight: 16, flex: 1 });
    const cta = () => tree.root.findAll((n) => n.type === TouchableOpacity && n.props.testID === "signup-email-submit")[0];
    expect(cta().props.disabled).toBe(true);

    await type("signup-email-input", "a@b.co");
    await type("signup-password-input", "Abcdefg1");
    await type("signup-confirm-input", "Abcdefg1");
    expect(texts().filter((t) => /valid email|at least 8|do not match/.test(t))).toEqual([]);
    expect(cta().props.disabled).toBe(false);
  });

  test("keyboard keys: Next on email/password, Done on confirm submits a valid form (CTA can sit behind the keyboard)", async () => {
    const { useAuthStore } = require("../../src/features/auth/auth.store");
    const signup = useAuthStore.getState().signup as jest.Mock;
    signup.mockClear();
    await render(<SignupEmailScreen />);
    expect(input("signup-email-input").props.returnKeyType).toBe("next");
    expect(input("signup-password-input").props.returnKeyType).toBe("next");
    expect(input("signup-confirm-input").props.returnKeyType).toBe("done");
    expect(input("signup-email-input").props.submitBehavior).toBe("submit");
    // Done on an invalid form does not submit
    await act(async () => input("signup-confirm-input").props.onSubmitEditing());
    expect(signup).not.toHaveBeenCalled();
    await type("signup-email-input", "a@b.co");
    await type("signup-password-input", "Abcdefg1");
    await type("signup-confirm-input", "Abcdefg1");
    await act(async () => input("signup-confirm-input").props.onSubmitEditing());
    expect(signup).toHaveBeenCalledWith(expect.objectContaining({ email: "a@b.co", password: "Abcdefg1" }));
  });
});
