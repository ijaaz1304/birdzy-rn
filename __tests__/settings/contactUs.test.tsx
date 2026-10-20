import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { ContactUsScreen } from "../../src/features/settings/screens/ContactUsScreen";
import {
  SettingsSelectField,
  SettingsTextArea,
} from "../../src/features/settings/components";
import { Button } from "../../src/atoms";
import { sendRatingFeedback } from "../../src/services/rating/ratingFeedback.service";
import { SETTINGS_STRINGS } from "../../src/config/strings/settings.strings";
jest.mock("../../src/features/settings/components", () => ({
  SettingsHeader: () => null,
  SettingsSelectField: jest.fn(() => null),
  SettingsTextArea: jest.fn(() => null),
}));
jest.mock("../../src/atoms", () => ({
  Text: require("react-native").Text,
  Button: jest.fn(() => null),
}));
jest.mock("../../src/hooks", () => ({
  useToast: () => ({ showToast: jest.fn() }),
}));
jest.mock("../../src/features/settings/settingsColors", () => ({
  useSettingsColors: () => ({}),
}));
jest.mock("../../src/features/auth/auth.store", () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({ user: { name: "Test", email: "test@example.com" } }),
}));
jest.mock("../../src/services/rating/ratingFeedback.service", () => ({
  sendRatingFeedback: jest.fn(async () => true),
}));
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));
let renderer: ReactTestRenderer;
afterEach(async () => {
  await act(async () => renderer?.unmount());
});
beforeEach(() => jest.clearAllMocks());
it("offers subject options and combines the chosen subject with the message", async () => {
  await act(async () => {
    renderer = create(<ContactUsScreen />);
  });
  const option = SETTINGS_STRINGS.contactUs.topics[0];
  expect(
    renderer.root.findByType(SettingsSelectField).props.options.length
  ).toBeGreaterThan(1);
  await act(async () => {
    renderer.root.findByType(SettingsSelectField).props.onSelect(option.value);
    renderer.root
      .findByType(SettingsTextArea)
      .props.onChangeText("  Please help  ");
  });
  await act(async () => renderer.root.findByType(Button).props.onPress());
  expect(sendRatingFeedback).toHaveBeenCalledWith(
    expect.objectContaining({ message: `${option.label} - Please help` })
  );
});
it("requires both a subject and a message", async () => {
  await act(async () => {
    renderer = create(<ContactUsScreen />);
  });
  expect(renderer.root.findByType(Button).props.disabled).toBe(true);
  await act(async () => renderer.root.findByType(Button).props.onPress());
  expect(sendRatingFeedback).not.toHaveBeenCalled();
});
