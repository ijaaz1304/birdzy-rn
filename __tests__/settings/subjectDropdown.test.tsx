import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { TouchableOpacity, Text } from "react-native";
import { SettingsSelectField } from "../../src/features/settings/components/SettingsFormFields";

jest.mock("../../src/atoms", () => ({ Text: require("react-native").Text }));
jest.mock("../../src/molecules/Dropdown/Dropdown", () => ({
  Dropdown: () => null,
}));
jest.mock(
  "../../src/assets/icons/settings/subject-chevron.svg",
  () => () => null
);
jest.mock("../../src/features/settings/settingsColors", () => ({
  useSettingsColors: () => ({}),
}));
let renderer: ReactTestRenderer;
afterEach(async () => {
  await act(async () => renderer?.unmount());
});
it("expands the subject options inline and closes after selecting a topic", async () => {
  const onSelect = jest.fn();
  await act(async () => {
    renderer = create(
      <SettingsSelectField
        label="Subject"
        placeholder="Select a topic"
        inlineMenu
        options={[
          { label: "Bug Report", value: "bug" },
          { label: "Others", value: "other" },
        ]}
        onSelect={onSelect}
      />
    );
  });
  const trigger = () => renderer.root.findAllByType(TouchableOpacity)[0];
  expect(trigger().props.accessibilityState.expanded).toBe(false);
  await act(async () => trigger().props.onPress());
  expect(trigger().props.accessibilityState.expanded).toBe(true);
  expect(
    renderer.root
      .findAllByType(Text)
      .some((node) => node.props.children === "Bug Report")
  ).toBe(true);
  await act(async () =>
    renderer.root.findAllByType(TouchableOpacity)[1].props.onPress()
  );
  expect(onSelect).toHaveBeenCalledWith("bug");
  expect(trigger().props.accessibilityState.expanded).toBe(false);
});
