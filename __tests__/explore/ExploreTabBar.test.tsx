import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { StyleSheet, TouchableOpacity } from "react-native";

jest.mock("../../src/atoms", () => ({ Text: "Text" }));
jest.mock("../../src/hooks/useTheme", () => ({
  useTheme: () => ({
    colors: { textBrand: "#F7B23A", textSecondary: "#888" },
  }),
  useIsDark: () => false,
}));
import { ExploreTabBar } from "../../src/features/explore/components/ExploreTabBar";

let tree: TestRenderer.ReactTestRenderer;
const render = async (
  props: Partial<React.ComponentProps<typeof ExploreTabBar>> = {}
) => {
  const onSelect = jest.fn();
  await act(async () => {
    tree = TestRenderer.create(
      <ExploreTabBar
        activeTab="growingNow"
        counts={{ growingNow: null, yearRound: null }}
        onSelect={onSelect}
        {...props}
      />
    );
  });
  return onSelect;
};
const tabs = () => tree.root.findAllByType(TouchableOpacity);
const style = (index: number) => StyleSheet.flatten(tabs()[index].props.style);
const labelText = (index: number) => {
  const children = tabs()[index].findByType("Text" as never).props.children;
  return Array.isArray(children) ? children.join("") : String(children);
};
afterEach(async () => {
  if (tree) await act(async () => tree.unmount());
});

test("the two tabs take equal halves of the row with their text centred", async () => {
  await render();
  expect(tabs()).toHaveLength(2);
  for (const index of [0, 1]) {
    expect(style(index).flex).toBe(1);
    expect(style(index).alignItems).toBe("center");
  }
});

test("shows Spotted Now and Year-round labels with counts", async () => {
  await render({
    activeTab: "yearRound",
    counts: { growingNow: 12, yearRound: 4 },
  });
  expect(labelText(0)).toContain("Spotted Now");
  expect(labelText(0)).toContain("12");
  expect(labelText(1)).toContain("Year-round");
  expect(labelText(1)).toContain("4");
});

test("selecting a tab notifies the caller", async () => {
  const onSelect = await render();
  await act(async () => {
    tabs()[1].props.onPress();
  });
  expect(onSelect).toHaveBeenCalledWith("yearRound");
});
