import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { ScrollView, Text, View, StyleSheet } from "react-native";
import { CatalogueDetailCarousel } from "../../src/features/collection/components/CatalogueDetailCarousel";
jest.mock("../../src/hooks/useTheme", () => ({
  useTheme: () => require("../../src/design-system/themes").lightTheme,
}));
jest.mock("../../src/components/AppImage", () => ({
  AppImage: "AppImage",
  CachedRemoteImage: "CachedRemoteImage",
}));
jest.mock("../../src/assets", () => ({
  Images: { card_image_placeholder: 1 },
}));
jest.mock("react-native-vector-icons/MaterialIcons", () => "MaterialIcons");
let tree: ReactTestRenderer;
const images = [
  { id: "capture", uri: "file:///bird.jpg", isReference: false },
  { id: "reference", uri: "https://example.com/bird.jpg", isReference: true },
];
const hasReference = () =>
  tree.root
    .findAllByType(Text)
    .some((node) => node.props.children === "Reference");
const layout = async (width: number) =>
  act(async () =>
    tree.root
      .findAllByType(View)
      .find((node) => node.props.onLayout)!
      .props.onLayout({ nativeEvent: { layout: { width } } })
  );
async function mount(dark = false) {
  await act(async () => {
    tree = create(
      <CatalogueDetailCarousel images={images} figmaDesign isDark={dark} />
    );
  });
  await layout(393);
}
afterEach(async () => {
  await act(async () => tree?.unmount());
});
it("shows only the reference badge, keeps captured photos unbadged and uses 180px inset photos", async () => {
  await mount();
  expect(hasReference()).toBe(false);
  expect(
    StyleSheet.flatten(tree.root.findByType(ScrollView).props.style)
  ).toMatchObject({ width: 353, height: 180 });
  await act(async () =>
    tree.root.findByProps({ accessibilityLabel: "Next image" }).props.onPress()
  );
  expect(hasReference()).toBe(true);
  await act(async () =>
    tree.root
      .findByProps({ accessibilityLabel: "Previous image" })
      .props.onPress()
  );
  expect(hasReference()).toBe(false);
});
it("preserves selection on resize, rejects old momentum and resets when images are replaced", async () => {
  await mount();
  await act(async () =>
    tree.root.findByProps({ accessibilityLabel: "Next image" }).props.onPress()
  );
  await layout(430);
  expect(hasReference()).toBe(true);
  await act(async () =>
    tree.root
      .findByType(ScrollView)
      .props.onMomentumScrollEnd({
        nativeEvent: {
          contentOffset: { x: 0 },
          layoutMeasurement: { width: 353 },
        },
      })
  );
  expect(hasReference()).toBe(true);
  await act(async () =>
    tree.update(
      <CatalogueDetailCarousel
        images={[{ ...images[0], uri: "file:///new.jpg" }, images[1]]}
        figmaDesign
      />
    )
  );
  expect(hasReference()).toBe(false);
});
it("uses the dark reference colour and displays a neutral failed-image state", async () => {
  await mount(true);
  await act(async () =>
    tree.root.findByProps({ accessibilityLabel: "Next image" }).props.onPress()
  );
  const label = tree.root
    .findAllByType(Text)
    .find((node) => node.props.children === "Reference")!;
  expect(
    StyleSheet.flatten(label.parent!.parent!.props.style).backgroundColor
  ).toBe("#16B6B4");
  const photo = tree.root
    .findAllByType("CachedRemoteImage" as never)
    .find((node) => node.props.uri === images[1].uri)!;
  await act(async () => photo.props.onError());
  expect(
    tree.root
      .findAllByType(Text)
      .some((node) => node.props.children === "No image")
  ).toBe(true);
});
