import React from "react";
import { act, create, ReactTestRenderer } from "react-test-renderer";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { ThemeContext } from "../../src/app/ThemeProvider";
import { themes } from "../../src/design-system/themes";

jest.mock("../../src/components/AppImage", () => ({ AppImage: "AppImage", CachedRemoteImage: "CachedRemoteImage" }));
jest.mock("../../src/assets", () => ({ Images: new Proxy({}, { get: () => 1 }), PASSWORD_VISIBILITY_ICON_SIZE: 24 }));
jest.mock("react-native-vector-icons/Feather", () => "Feather");
jest.mock("react-native-vector-icons/Ionicons", () => "Ionicons");
jest.mock("react-native-vector-icons/FontAwesome5", () => "FontAwesome5");
jest.mock("react-native-vector-icons/MaterialIcons", () => "MaterialIcons");
jest.mock("react-native-vector-icons/MaterialCommunityIcons", () => "MaterialCommunityIcons");
jest.mock("react-native-gesture-handler", () => ({ GestureDetector: ({ children }: any) => children, Gesture: {} }));
jest.mock("react-native-svg", () => ({ __esModule: true, default: "Svg", Path: "Path" }));
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 47, bottom: 34, left: 0, right: 0 }),
}));
jest.mock("../../src/features/auth/auth.store", () => {
  const state = { resendVerificationEmail: jest.fn(), isLoading: false, error: null as string | null, setError: jest.fn() };
  const useAuthStore: any = () => state;
  useAuthStore.getState = () => state;
  return { useAuthStore, __state: state };
});
jest.mock("../../src/config/context", () => ({ useFeatureConfig: () => ({ verifyEmail: {} }) }));
jest.mock("../../src/components/AppLogsTooltip/AppLogsTooltip", () => ({ TOOLTIP_ELIGIBLE_FOR_SIGNUP_KEY: "k" }));
jest.mock("../../src/molecules", () => ({ ScreenContainer: ({ children }: any) => children }));
jest.mock("../../src/features/auth/components/AuthScreenBackground", () => ({
  AuthScreenBackground: () => null,
  AuthScreenStatusBar: () => null,
}));

import { VerifyEmailScreen } from "../../src/features/auth/screens/VerifyEmailScreen";

// Default font and display settings: Typography Build A keeps exact Figma sizes at font scale 1
// (React Native's Jest setup otherwise reports a font scale of 2).
jest.mock("react-native/Libraries/Utilities/useWindowDimensions", () => ({
  __esModule: true,
  default: () => ({ width: 393, height: 852, scale: 3, fontScale: 1 }),
}));

const nav = require("@react-navigation/native");
let tree: ReactTestRenderer;
afterEach(async () => {
  if (tree) await act(async () => tree.unmount());
  jest.useRealTimers();
});
const navObj = { navigate: jest.fn(), goBack: jest.fn(), dispatch: jest.fn() };
const render = async () => {
  nav.useNavigation.mockReturnValue(navObj);
  nav.useRoute.mockReturnValue({ params: { email: "someone@example.com", isPasswordReset: true } });
  await act(async () => {
    tree = create(
      <ThemeContext.Provider value={{ theme: themes.light, themeMode: "light", setThemeMode: jest.fn() } as never}>
        <VerifyEmailScreen />
      </ThemeContext.Provider>
    );
  });
};
const flat = (n: any) => StyleSheet.flatten(n.props.style) ?? {};
const texts = () => tree.root.findAllByType(Text);
const byText = (label: string) => texts().find((n) => [n.props.children].flat().join("") === label)!;
const input = () => tree.root.findAll((n) => n.type === TextInput && n.props.testID === "verify-code-input")[0];
const fieldBox = () => {
  let p: any = input().parent;
  while (p && !(p.type === View && flat(p).borderWidth === 1)) p = p.parent;
  return p;
};

describe("verify email (Figma 8015:111084 / 8015:111149)", () => {
  test("title Title/20 max 2 lines; subtitle Body/14 wraps fully with the change-email link", async () => {
    await render();
    const title = byText("Verify your email");
    expect(title.props.numberOfLines).toBe(2);
    expect(flat(title)).toMatchObject({ fontSize: 20, lineHeight: 28, fontFamily: "Satoshi-Bold" });
    expect(flat(title).fontWeight).toBeUndefined();
    const subtitle = texts().find((n) => [n.props.children].flat().join("").startsWith("We sent your code to someone@example.com"))!;
    expect(subtitle.props.numberOfLines).toBeUndefined();
    expect(flat(subtitle)).toMatchObject({ fontSize: 14, lineHeight: 20 });
    const link = byText("Change email address.");
    expect(flat(link).textDecorationLine).toBe("underline");
  });

  test("label 14/20 Medium (max 2 lines); field 48pt minimum that grows; Verify 44pt min with Medium 16/24", async () => {
    await render();
    const label = byText("Verification code");
    expect(label.props.numberOfLines).toBe(2);
    expect(flat(label)).toMatchObject({ fontSize: 14, lineHeight: 20, fontFamily: "Satoshi-Medium" });
    expect(flat(fieldBox())).toMatchObject({ minHeight: 48 });
    expect(flat(fieldBox()).height).toBeUndefined();
    expect(flat(input())).toMatchObject({ fontSize: 16, fontFamily: "Satoshi-Regular" });
    const cta = tree.root.findAll((n) => n.type === TouchableOpacity && n.props.testID === "verify-submit")[0];
    expect(flat(cta)).toMatchObject({ minHeight: 44, paddingVertical: 10 });
    expect(flat(cta).height).toBeUndefined();
    expect(flat(cta.findByType(Text))).toMatchObject({ fontFamily: "Satoshi-Medium", fontSize: 16, lineHeight: 24 });
  });

  test("resend row: 44pt min, Button/16; counting down in tertiary, then 'Resend' underlined in brand", async () => {
    jest.useFakeTimers();
    await render();
    const row = tree.root.findAll((n) => n.type === TouchableOpacity && n.props.testID === "verify-resend")[0];
    expect(flat(row).minHeight).toBe(44);
    expect(row.props.disabled).toBe(true);
    const counting = texts().find((n) => [n.props.children].flat().join("").startsWith("Resend 60s"))!;
    expect(flat(counting).color).toBe(themes.light.colors.textTertiary);
    for (let i = 0; i < 60; i++) {
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });
    }
    const ready = byText("Resend");
    expect(flat(ready).textDecorationLine).toBe("underline");
    expect(flat(ready).color).toBe(themes.light.colors.primaryCTA);
  });

  test("keyboard Done submits a full code; an error shows the shared error row with a red border", async () => {
    await render();
    await act(async () => input().props.onChangeText("123456"));
    await act(async () => input().props.onSubmitEditing());
    expect(navObj.navigate).toHaveBeenCalledWith("CreateNewPassword", { email: "someone@example.com", code: "123456" });
    require("../../src/features/auth/auth.store").__state.error = "That code is not valid.";
    await act(async () => input().props.onChangeText("12345"));
    expect(byText("That code is not valid.")).toBeDefined();
    expect(flat(fieldBox()).borderColor).toBe((themes.light.colors as any).borderError);
    require("../../src/features/auth/auth.store").__state.error = null;
  });
});
