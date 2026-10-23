jest.mock("../../src/atoms", () => ({
  Text: require("react-native").Text,
  Button: () => null,
}));
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { Text, TouchableOpacity } from "react-native";
import { LoginSecurityScreen } from "../../src/features/settings/screens/LoginSecurityScreen";
import { PasswordOverviewScreen } from "../../src/features/settings/screens/PasswordOverviewScreen";
let mockSession: any;
const mockNavigate = jest.fn();
const mockRootNavigate = jest.fn();
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    getParent: () => ({ navigate: mockRootNavigate }),
  }),
}));
jest.mock("../../src/features/auth/auth.store", () => ({
  useAuthStore: (selector: any) => selector(mockSession),
}));
jest.mock("../../src/features/settings/settingsColors", () => ({
  useSettingsColors: () => ({}),
}));
jest.mock("../../src/features/settings/components", () => ({
  SettingsHeader: () => null,
  SettingsIcon: () => null,
  PasswordSheet: () => null,
}));
jest.mock("../../src/hooks", () => ({
  useToast: () => ({ showToast: jest.fn() }),
}));
jest.mock("../../src/features/settings/passwordActions", () => ({
  changePassword: jest.fn(),
  createPassword: jest.fn(),
}));
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children }: any) => children,
}));
let renderer: ReactTestRenderer;
const labels = () =>
  renderer.root.findAllByType(Text).map((node) => node.props.children);
beforeEach(() => {
  jest.clearAllMocks();
  mockSession = {
    isAuthenticated: true,
    isGuest: true,
    guestId: "guest-1",
    user: { email: "" },
  };
});
afterEach(async () => {
  await act(async () => renderer?.unmount());
});
it("offers guests Login and Sign up without password actions and preserves their promotion identity", async () => {
  await act(async () => {
    renderer = create(<LoginSecurityScreen />);
  });
  expect(labels()).toEqual(["Log in", "Sign up"]);
  await act(async () =>
    renderer.root.findAllByType(TouchableOpacity)[0].props.onPress()
  );
  expect(mockRootNavigate).toHaveBeenCalledWith("AuthStack", {
    screen: "Login",
    params: { guestId: "guest-1", fromGuest: true },
  });
  await act(async () =>
    renderer.root.findAllByType(TouchableOpacity)[1].props.onPress()
  );
  expect(mockRootNavigate).toHaveBeenCalledWith("AuthStack", {
    screen: "SignUp",
    params: { guestId: "guest-1", fromGuest: true },
  });
});
it.each(["change", "create"] as const)(
  "does not show the %s password form to guests via direct navigation",
  async (mode) => {
    await act(async () => {
      renderer = create(<PasswordOverviewScreen mode={mode} />);
    });
    expect(labels()).toEqual(["Log in", "Sign up"]);
  }
);
it("preserves the registered account security screens", async () => {
  mockSession = {
    isAuthenticated: true,
    isGuest: false,
    guestId: null,
    user: { email: "user@example.com" },
  };
  await act(async () => {
    renderer = create(<LoginSecurityScreen />);
  });
  expect(labels()).toEqual(["Change password"]);
});
