import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { ProfileSettingsScreen } from "../../src/features/settings/screens/ProfileSettingsScreen";
import { Button } from "../../src/atoms";
import {
  SettingsTextField,
  SettingsSelectField,
} from "../../src/features/settings/components";
const mockSave = jest.fn();
const mockToast = jest.fn();
const mockFetch = jest.fn();
const mockLoad = jest.fn();
const mockUser = {
  name: "Test",
  email: "test@example.com",
  phone: "",
  country: "US",
};
jest.mock("../../src/features/auth/auth.store", () => ({
  useAuthStore: (selector: any) => selector({ user: mockUser }),
}));
jest.mock("../../src/features/profile/profile.store", () => ({
  useProfileStore: () => ({
    profile: null,
    fetchProfile: mockFetch,
    updateProfile: mockSave,
  }),
}));
jest.mock("../../src/data/countries.store", () => ({
  useCountriesStore: () => ({
    countryOptions: [],
    dropdownOptions: [],
    loading: false,
    loadCountries: mockLoad,
  }),
}));
jest.mock("../../src/features/settings/settingsColors", () => ({
  useSettingsColors: () => ({}),
}));
jest.mock("../../src/hooks", () => ({
  useToast: () => ({ showToast: mockToast }),
}));
jest.mock("../../src/atoms", () => ({
  Text: require("react-native").Text,
  Button: jest.fn(() => null),
}));
jest.mock("../../src/features/settings/components", () => ({
  SettingsHeader: () => null,
  SettingsTextField: jest.fn(() => null),
  SettingsSelectField: jest.fn(() => null),
}));
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children }: any) => children,
}));
let renderer: ReactTestRenderer;
beforeEach(() => {
  jest.clearAllMocks();
  mockSave.mockResolvedValue(undefined);
});
afterEach(async () => {
  await act(async () => renderer?.unmount());
});
it("shows the current profile fields and keeps email read-only", async () => {
  await act(async () => {
    renderer = create(<ProfileSettingsScreen />);
  });
  const fields = renderer.root.findAllByType(SettingsTextField);
  expect(fields).toHaveLength(3);
  expect(fields[1].props.editable).toBe(false);
  expect(renderer.root.findAllByType(SettingsSelectField)).toHaveLength(1);
});
it("saves name, optional phone and country without changing email or removed fields", async () => {
  await act(async () => {
    renderer = create(<ProfileSettingsScreen />);
  });
  await act(async () =>
    renderer.root
      .findAllByType(SettingsTextField)[0]
      .props.onChangeText(" New Name ")
  );
  expect(mockSave).not.toHaveBeenCalled();
  await act(async () => renderer.root.findByType(Button).props.onPress());
  expect(mockSave).toHaveBeenCalledWith({
    name: "New Name",
    phone: "",
    country: "US",
  });
});
