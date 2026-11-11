import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { TouchableOpacity } from "react-native";

jest.mock("../../src/atoms", () => ({ Text: "Text" }));
jest.mock("../../src/hooks/useTheme", () => ({
  useTheme: () => ({
    colors: { primaryCTA: "#C7630C", onPrimary: "#FFFFFF" },
  }),
}));
import { ExploreEntryButton } from "../../src/features/explore/components/ExploreEntryButton";

test("renders the label and forwards presses", async () => {
  const onPress = jest.fn();
  let tree!: TestRenderer.ReactTestRenderer;
  await act(async () => {
    tree = TestRenderer.create(
      <ExploreEntryButton label="Explore Near You" onPress={onPress} />
    );
  });
  const button = tree.root.findByType(TouchableOpacity);
  expect(button.props.accessibilityLabel).toBe("Explore Near You");
  await act(async () => {
    button.props.onPress();
  });
  expect(onPress).toHaveBeenCalled();
});
