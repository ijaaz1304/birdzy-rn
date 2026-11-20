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
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 47, bottom: 34, left: 0, right: 0 }),
}));
jest.mock("../../src/features/post-auth-onboarding", () => ({ resetToPostAuthOnboarding: jest.fn() }));
jest.mock("../../src/data/countries.store", () => ({
  useCountriesStore: () => ({
    dropdownOptions: [{ label: "Saint Vincent and the Grenadines", value: "VC" }],
    loading: false,
    loadCountries: jest.fn(),
  }),
}));
jest.mock("../../src/config/context", () => ({
  useFeatureConfig: () => ({
    completeProfile: {
      title: "Almost finished!",
      subtitle: "Tell us a bit about yourself so we can tailor the experience just for you.",
      namePlaceholder: "Enter name",
      agePlaceholder: "Enter age",
      genderPlaceholder: "Select gender",
      countryPlaceholder: "Select country",
      submitButtonText: "Continue",
      skipText: "Skip",
    },
  }),
}));
jest.mock("../../src/molecules/ScreenContainer/ScreenContainer", () => ({ ScreenContainer: ({ children }: any) => children }));

import { CompleteProfileScreen } from "../../src/features/auth/screens/CompleteProfileScreen";

// Default font and display settings: Typography Build A keeps exact Figma sizes at font scale 1
// (React Native's Jest setup otherwise reports a font scale of 2).
jest.mock("react-native/Libraries/Utilities/useWindowDimensions", () => ({
  __esModule: true,
  default: () => ({ width: 393, height: 852, scale: 3, fontScale: 1 }),
}));

let tree: ReactTestRenderer;
afterEach(async () => {
  if (tree) await act(async () => tree.unmount());
});
const render = async () => {
  await act(async () => {
    tree = create(
      <ThemeContext.Provider value={{ theme: themes.light, themeMode: "light", setThemeMode: jest.fn() } as never}>
        <CompleteProfileScreen />
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

describe("complete profile (Figma 8015:111162 / 8015:111176)", () => {
  test("title Title/20 max 2 lines, subtitle Body/14 wraps fully; Skip is a 32pt pill with Button/14", async () => {
    await render();
    const title = byText("Almost finished!");
    expect(title.props.numberOfLines).toBe(2);
    expect(flat(title)).toMatchObject({ fontSize: 20, lineHeight: 28 });
    expect(flat(title).fontWeight).toBeUndefined();
    const sub = byText("Tell us a bit about yourself so we can tailor the experience just for you.");
    expect(sub.props.numberOfLines).toBeUndefined();
    expect(flat(sub)).toMatchObject({ fontSize: 14, lineHeight: 20 });
    const skip = byId(TouchableOpacity, "complete-profile-skip");
    expect(flat(skip)).toMatchObject({ minHeight: 32, paddingHorizontal: 12 });
    expect(flat(byText("Skip"))).toMatchObject({ fontSize: 14, lineHeight: 20 });
  });

  test("text fields and selects are 48pt minimum (grow); select values may wrap to 2 lines", async () => {
    await render();
    for (const id of ["complete-profile-name", "complete-profile-age"]) {
      const b = flat(box(byId(TextInput, id)));
      expect(b.minHeight).toBe(48);
      expect(b.height).toBeUndefined();
      expect(flat(byId(TextInput, id))).toMatchObject({ fontSize: 16, fontFamily: "Satoshi-Regular" });
    }
    for (const id of ["complete-profile-gender", "complete-profile-country"]) {
      const btn = byId(TouchableOpacity, id);
      expect(flat(btn)).toMatchObject({ minHeight: 48, paddingHorizontal: 16 });
      expect(flat(btn).height).toBeUndefined();
      const label = btn.findAllByType(Text)[0];
      expect(label.props.numberOfLines).toBe(2);
      expect(flat(label)).toMatchObject({ fontSize: 16, lineHeight: 24 });
    }
  });

  test("Continue sits in the form (16pt below the fields), full width, 44pt min with Medium 16/24; Next moves name → age", async () => {
    await render();
    const cta = byId(TouchableOpacity, "complete-profile-continue");
    expect(flat(cta)).toMatchObject({ minHeight: 44, marginTop: 16 });
    expect(flat(cta).width).toBeUndefined();
    expect(flat(cta).position).toBeUndefined();
    expect(flat(cta.findByType(Text))).toMatchObject({ fontFamily: "Satoshi-Medium", fontSize: 16, lineHeight: 24 });
    const name = byId(TextInput, "complete-profile-name");
    expect(name.props.returnKeyType).toBe("next");
    expect(byId(TextInput, "complete-profile-age").props.returnKeyType).toBe("done");
  });
});
