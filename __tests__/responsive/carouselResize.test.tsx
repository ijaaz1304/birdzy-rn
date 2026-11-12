import React from "react";
import { act, create, ReactTestRenderer } from "react-test-renderer";
import { ScrollView, StyleSheet, View } from "react-native";
import { CatalogueDetailCarousel } from "../../src/features/collection/components/CatalogueDetailCarousel";
import { CardImageCarousel } from "../../src/molecules/CardImageCarousel/CardImageCarousel";

jest.mock("../../src/components/AppImage", () => ({
  AppImage: "AppImage",
  CachedRemoteImage: "CachedRemoteImage",
}));
jest.mock("../../src/assets", () => ({
  Images: { card_image_placeholder: 1 },
}));
jest.mock("react-native-vector-icons/MaterialIcons", () => "MaterialIcons");
jest.mock("../../src/utils/mushroomCardUtils", () => ({
  normalizeImageUrls: (urls: string[] | undefined) => urls ?? [],
}));

let tree: ReactTestRenderer;
const images = [1, 2, 3].map((uri) => ({ id: String(uri), uri }));
const urls = images.map(({ id }) => `https://example.com/${id}.jpg`);
const layout = async (width: number) => {
  await act(async () => {
    tree.root
      .findAllByType(View)
      .find((node) => node.props.onLayout)!
      .props.onLayout({ nativeEvent: { layout: { width, height: 180 } } });
  });
};
const scroll = () => tree.root.findByType(ScrollView);
const select = async (index: number, width: number) => {
  await act(async () => {
    scroll().props.onMomentumScrollEnd({
      nativeEvent: {
        contentOffset: { x: index * width },
        layoutMeasurement: { width },
      },
    });
  });
};
afterEach(async () => {
  if (tree) await act(async () => tree.unmount());
});

test("detail pages use the parent width and preserve the selected bird image across resize", async () => {
  await act(async () => {
    tree = create(<CatalogueDetailCarousel images={images} />);
  });
  await layout(393);
  expect(StyleSheet.flatten(scroll().props.style).width).toBe(353);
  await select(1, 353);
  const scrollTo = scroll().instance.scrollTo as jest.Mock;
  scrollTo.mockClear();
  await layout(320);
  expect(StyleSheet.flatten(scroll().props.style).width).toBe(280);
  expect(scrollTo).toHaveBeenLastCalledWith({ x: 280, animated: false });
  // Ignore momentum events from the old viewport after a resize.
  await select(2, 353);
  // Native content-size callbacks can arrive after React's resize effect.
  await act(async () => scroll().props.onContentSizeChange(840, 180));
  expect(scrollTo).toHaveBeenLastCalledWith({ x: 280, animated: false });
  await layout(430);
  expect(scrollTo).toHaveBeenLastCalledWith({ x: 390, animated: false });
});

test("detail page selection is clamped when a refreshed image list shrinks", async () => {
  await act(async () => {
    tree = create(
      <CatalogueDetailCarousel images={images} widthPercent={90} />
    );
  });
  await layout(320);
  expect(StyleSheet.flatten(scroll().props.style).width).toBe(288);
  await select(2, 288);
  const scrollTo = scroll().instance.scrollTo as jest.Mock;
  await act(async () => {
    tree.update(
      <CatalogueDetailCarousel images={images.slice(0, 1)} widthPercent={90} />
    );
  });
  expect(scrollTo).toHaveBeenLastCalledWith({ x: 0, animated: false });
});

test("list-card paging retains its selected image when resized and handles a shorter list", async () => {
  await act(async () => {
    tree = create(
      <CardImageCarousel imageUrls={urls} autoSlideIntervalMs={0} />
    );
  });
  await layout(180);
  await select(2, 180);
  const scrollTo = scroll().instance.scrollTo as jest.Mock;
  await layout(140);
  expect(scrollTo).toHaveBeenLastCalledWith({ x: 280, animated: false });
  await act(async () => {
    tree.update(
      <CardImageCarousel imageUrls={urls.slice(0, 2)} autoSlideIntervalMs={0} />
    );
  });
  expect(scrollTo).toHaveBeenLastCalledWith({ x: 140, animated: false });
});
