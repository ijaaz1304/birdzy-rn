import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { StyleSheet, Text } from "react-native";
import { TopFiveMatchCard } from "../../src/features/camera/components/TopFiveMatchCard";
let mockDark = false;
jest.mock("../../src/hooks/useTheme", () => ({
  useTheme: () =>
    mockDark
      ? require("../../src/design-system/themes").darkTheme
      : require("../../src/design-system/themes").lightTheme,
  useIsDark: () => mockDark,
}));
jest.mock("../../src/components/AppImage", () => ({
  AppImage: "AppImage",
  CachedRemoteImage: "CachedRemoteImage",
}));
jest.mock("../../src/assets", () => ({ Images: { wishlistStarFilled: 1 } }));
let tree: ReactTestRenderer;
const open = jest.fn(),
  wishlist = jest.fn();
const props = {
  name: "House Sparrow",
  scientificName: "Passer domesticus",
  imageUri: "https://example.com/bird.jpg",
  wishlisted: false,
  onPress: open,
  onWishlistPress: wishlist,
};
afterEach(async () => {
  await act(async () => tree?.unmount());
  jest.clearAllMocks();
  mockDark = false;
});
async function mount() {
  await act(async () => {
    tree = create(<TopFiveMatchCard {...props} />);
  });
}
it("keeps the photo/details and wishlist touch actions independent", async () => {
  await mount();
  await act(async () =>
    tree.root
      .findByProps({
        accessibilityLabel: "Open photo details for House Sparrow",
      })
      .props.onPress()
  );
  await act(async () =>
    tree.root
      .findByProps({ accessibilityLabel: "View details for House Sparrow" })
      .props.onPress()
  );
  await act(async () =>
    tree.root
      .findByProps({ accessibilityLabel: "Add House Sparrow to wishlist" })
      .props.onPress()
  );
  expect(open).toHaveBeenCalledTimes(2);
  expect(wishlist).toHaveBeenCalledTimes(1);
});
it.each([false, true])("uses the Figma CTA in dark mode %s", async (dark) => {
  mockDark = dark;
  await mount();
  const button = tree.root.findByProps({
    accessibilityLabel: "View details for House Sparrow",
  });
  expect(StyleSheet.flatten(button.props.style).backgroundColor).toBe(
    dark ? "#16B6B4" : "#785284"
  );
});
it("recovers when a failed image URI is replaced and leaves long names available", async () => {
  await mount();
  await act(async () =>
    tree.root.findByType("CachedRemoteImage" as never).props.onError()
  );
  expect(
    tree.root
      .findAllByType(Text)
      .some((node) => node.props.children === "No image")
  ).toBe(true);
  const name = "Very long bird common name that wraps";
  await act(async () =>
    tree.update(
      <TopFiveMatchCard
        {...props}
        name={name}
        imageUri="https://example.com/new.jpg"
      />
    )
  );
  expect(tree.root.findByType("CachedRemoteImage" as never).props.uri).toBe(
    "https://example.com/new.jpg"
  );
  expect(
    tree.root.findAllByType(Text).find((node) => node.props.children === name)!
      .props.numberOfLines
  ).toBeUndefined();
});
