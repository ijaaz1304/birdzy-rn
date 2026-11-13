import React from "react";
import { act, create, ReactTestRenderer } from "react-test-renderer";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

jest.mock("../../src/features/settings/components/SettingsIcon", () => ({
  SettingsIcon: () => null,
}));
jest.mock("../../src/features/settings/settingsColors", () => ({
  useSettingsColors: () => ({
    text: "#111111",
    card: "#FFFFFF",
    cardBorder: "#E7E7E7",
    brand: "#402122",
    toggleOff: "#CCCCCC",
    knob: "#FFFFFF",
    danger: "#D00000",
  }),
}));
jest.mock("../../src/hooks/useTheme", () => ({
  useTheme: () => ({
    mode: "light",
    colors: { textPrimary: "#111111", surfacePrimary: "#FFFFFF", border: "#E7E7E7" },
  }),
}));
jest.mock("../../src/atoms", () => {
  const RN = require("react-native");
  return {
    Text: RN.Text,
    Button: ({ title, onPress }: any) =>
      require("react").createElement(RN.TouchableOpacity, { onPress }, require("react").createElement(RN.Text, null, title)),
  };
});
jest.mock("../../src/assets/freeScanClose.svg", () => "CloseGlyph");

import { SettingsHeader } from "../../src/features/settings/components/SettingsHeader";
import { SettingsItem } from "../../src/features/settings/components/SettingsItem";
import { SettingsSection } from "../../src/features/settings/components/SettingsSection";
import { SettingsAccountRow } from "../../src/features/settings/components/SettingsAccountRow";
import { SettingsAccountDialog } from "../../src/features/settings/components/SettingsAccountDialog";

let tree: ReactTestRenderer;
afterEach(async () => {
  if (tree) await act(async () => tree.unmount());
});
const render = async (el: React.ReactElement) => {
  await act(async () => {
    tree = create(el);
  });
};
const textNode = (label: string) =>
  tree.root.findAllByType(Text).find((n) => n.props.children === label)!;

test("header: 52pt minimum height that can grow, title max 2 lines, no fontWeight (Roboto fallback)", async () => {
  await render(<SettingsHeader title="Settings" />);
  const bar = tree.root.findAllByType(View).find((n) => StyleSheet.flatten(n.props.style)?.minHeight === 52);
  expect(bar).toBeDefined();
  expect(StyleSheet.flatten(bar!.props.style).height).toBeUndefined();
  const title = textNode("Settings");
  expect(title.props.numberOfLines).toBe(2);
  const st = StyleSheet.flatten(title.props.style);
  expect(st.fontWeight).toBeUndefined();
  expect(st.position).toBeUndefined();
  expect(st.fontSize).toBe(18);
});

test("section title: max 2 lines, no fontWeight", async () => {
  await render(
    <SettingsSection title="Help & Support">
      <SettingsItem title="FAQs" onPress={jest.fn()} showArrow />
    </SettingsSection>
  );
  const t = textNode("Help & Support");
  expect(t.props.numberOfLines).toBe(2);
  expect(StyleSheet.flatten(t.props.style).fontWeight).toBeUndefined();
});

test("row: title max 2 lines, description max 4, trailing value shrinks (max 2 lines)", async () => {
  await render(
    <SettingsItem
      title="Record diagnostic logs for support"
      subtitle="Saves anonymous diagnostic information to help support"
      value="System default"
      onPress={jest.fn()}
      showArrow
    />
  );
  expect(textNode("Record diagnostic logs for support").props.numberOfLines).toBe(2);
  expect(textNode("Saves anonymous diagnostic information to help support").props.numberOfLines).toBe(4);
  const value = textNode("System default");
  expect(value.props.numberOfLines).toBe(2);
  expect(StyleSheet.flatten(value.props.style).flexShrink).toBe(1);
  const trailing = tree.root.findAllByType(View).find((n) => StyleSheet.flatten(n.props.style)?.maxWidth === "45%");
  expect(trailing).toBeDefined();
  // row grows with content
  const row = tree.root.findAllByType(View).find((n) => StyleSheet.flatten(n.props.style)?.minHeight === 60)!;
  expect(StyleSheet.flatten(row.props.style).height).toBeUndefined();
});

test("toggle keeps its fixed 56×32 size with a 48pt touch height", async () => {
  const onChange = jest.fn();
  await render(<SettingsItem title="Notifications" switchValue onSwitchChange={onChange} />);
  const sw = tree.root.findAllByType(TouchableOpacity).find((n) => n.props.accessibilityRole === "switch")!;
  expect(StyleSheet.flatten(sw.props.style)).toMatchObject({ width: 56, height: 32 });
  expect(32 + sw.props.hitSlop.top + sw.props.hitSlop.bottom).toBeGreaterThanOrEqual(48);
  await act(async () => sw.props.onPress());
  expect(onChange).toHaveBeenCalledWith(false);
});

test("account row: title and subtitle wrap to 2 lines", async () => {
  await render(
    <SettingsAccountRow variant="profile" title="My Profile" subtitle="averyveryverylongemail@example.com" onPress={jest.fn()} />
  );
  expect(textNode("My Profile").props.numberOfLines).toBe(2);
  expect(textNode("averyveryverylongemail@example.com").props.numberOfLines).toBe(2);
});

test("account dialog: capped at the window and scrolls only if needed; title clear of the close button", async () => {
  await render(<SettingsAccountDialog visible kind="logout" onClose={jest.fn()} onConfirm={jest.fn()} />);
  const card = tree.root.findAllByType(View).find((n) => StyleSheet.flatten(n.props.style)?.maxHeight === "100%");
  expect(card).toBeDefined();
  expect(tree.root.findAllByType(ScrollView).length).toBe(1);
  const header = tree.root.findAllByType(View).find((n) => StyleSheet.flatten(n.props.style)?.paddingHorizontal === 44);
  expect(header).toBeDefined();
  for (const t of tree.root.findAllByType(Text)) {
    expect(StyleSheet.flatten(t.props.style)?.fontWeight).toBeUndefined();
  }
});
