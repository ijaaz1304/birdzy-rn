import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { Text as NativeText } from "react-native";
import { PasswordSheet } from "../../src/features/settings/components/PasswordSheet";
import { SettingsTextField } from "../../src/features/settings/components/SettingsFormFields";
import { Button } from "../../src/atoms";

jest.mock("../../src/atoms", () => ({
  Text: require("react-native").Text,
  Button: jest.fn(() => null),
}));
jest.mock("../../src/features/settings/settingsColors", () => ({
  useSettingsColors: () => ({}),
}));
jest.mock("../../src/features/settings/components/SettingsFormFields", () => ({
  SettingsTextField: jest.fn(() => null),
}));
jest.mock("../../src/features/settings/components/SettingsIcon", () => ({
  SettingsIcon: () => null,
}));
jest.mock("../../src/assets/icons/settings/drag-handle.svg", () => () => null);
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ bottom: 0 }),
}));
let renderer: ReactTestRenderer;
const onSubmit = jest.fn();
async function mount(mode: "change" | "create" = "change") {
  await act(async () => {
    renderer = create(
      <PasswordSheet
        visible
        mode={mode}
        onClose={jest.fn()}
        onSubmit={onSubmit}
      />
    );
  });
}
async function fill(password: string, confirm: string) {
  await act(async () => {
    const fields = renderer.root.findAllByType(SettingsTextField);
    fields[0].props.onChangeText(password);
    fields[1].props.onChangeText(confirm);
  });
}
beforeEach(() => {
  jest.clearAllMocks();
  onSubmit.mockResolvedValue(undefined);
});
afterEach(async () => {
  await act(async () => renderer?.unmount());
});
it.each(["change", "create"] as const)(
  "%s requires only new password and confirmation",
  async (mode) => {
    await mount(mode);
    expect(renderer.root.findAllByType(SettingsTextField)).toHaveLength(2);
    expect(renderer.root.findByType(Button).props.disabled).toBe(true);
    await fill("StrongPass1!", "StrongPass1!");
    expect(renderer.root.findByType(Button).props.disabled).toBe(false);
    await act(async () => renderer.root.findByType(Button).props.onPress());
    expect(onSubmit).toHaveBeenCalledWith({ newPassword: "StrongPass1!" });
  }
);
it("rejects mismatched confirmation without sending a request", async () => {
  await mount();
  await fill("StrongPass1!", "DifferentPass1!");
  await act(async () => renderer.root.findByType(Button).props.onPress());
  expect(onSubmit).not.toHaveBeenCalled();
});
it("rejects a weak password without sending a request", async () => {
  await mount();
  await fill("weak", "weak");
  await act(async () => renderer.root.findByType(Button).props.onPress());
  expect(onSubmit).not.toHaveBeenCalled();
});
it("keeps the form open and displays a save error", async () => {
  onSubmit.mockRejectedValue(new Error("Could not save"));
  await mount();
  await fill("StrongPass1!", "StrongPass1!");
  await act(async () => renderer.root.findByType(Button).props.onPress());
  expect(
    renderer.root
      .findAllByType(NativeText)
      .some((node) => node.props.children === "Could not save")
  ).toBe(true);
  expect(renderer.root.findByType(Button).props.loading).toBe(false);
});
