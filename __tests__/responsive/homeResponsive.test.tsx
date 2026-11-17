import React from "react";
import { act, create, ReactTestRenderer } from "react-test-renderer";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ThemeContext } from "../../src/app/ThemeProvider";
import { themes } from "../../src/design-system/themes";

const mockDims = { width: 393, height: 852, scale: 3, fontScale: 1 };
jest.mock("react-native/Libraries/Utilities/useWindowDimensions", () => ({
  __esModule: true,
  default: () => mockDims,
}));
jest.mock("../../src/components/AppImage", () => ({
  AppImage: "AppImage",
  AppImageBackground: ({ children }: any) => children ?? null,
  CachedRemoteImage: "CachedRemoteImage",
}));
jest.mock("../../src/assets", () => ({
  Images: new Proxy({}, { get: () => 1 }),
  DiscountBannerDarkSvg: 1,
}));
jest.mock("react-native-vector-icons/MaterialIcons", () => "MaterialIcons");
jest.mock("@react-native-community/geolocation", () => ({
  __esModule: true,
  default: { getCurrentPosition: jest.fn(), watchPosition: jest.fn(), clearWatch: jest.fn(), setRNConfiguration: jest.fn() },
}));
jest.mock("react-native-vector-icons/Feather", () => "Feather");
jest.mock("react-native-vector-icons/Ionicons", () => "Ionicons");
jest.mock("react-native-vector-icons/FontAwesome5", () => "FontAwesome5");
jest.mock("react-native-vector-icons/MaterialCommunityIcons", () => "MaterialCommunityIcons");
jest.mock("react-native-gesture-handler", () => ({ GestureDetector: ({ children }: any) => children, Gesture: {} }));
jest.mock("react-native-svg", () => ({ __esModule: true, default: "Svg", Path: "Path", Circle: "Circle", G: "G" }));
jest.mock("react-native-linear-gradient", () => ({ __esModule: true, default: ({ children }: any) => children }));

import { HomeBirdCornerSection } from "../../src/features/home/components/HomeBirdCornerSection";
import AppOtherAppCard from "../../src/components/shared/AppOtherAppCard";
import DiscountBanner from "../../src/components/customui/DiscountBanner";
import DiscountCountdownBanner from "../../src/components/customui/DiscountCountdownBanner";

let tree: ReactTestRenderer;
afterEach(async () => {
  if (tree) await act(async () => tree.unmount());
  mockDims.width = 393;
  mockDims.fontScale = 1;
});
const render = async (el: React.ReactElement) => {
  await act(async () => {
    tree = create(
      <ThemeContext.Provider value={{ theme: themes.light, themeMode: "light", setThemeMode: jest.fn() } as never}>
        {el}
      </ThemeContext.Provider>
    );
  });
};
const flat = (n: any) => StyleSheet.flatten(n.props.style) ?? {};
const texts = () => tree.root.findAllByType(Text);
const byText = (label: string) => texts().find((n) => [n.props.children].flat().join("") === label)!;

describe("Your Bird Corner (Figma 8598:65523)", () => {
  test("cards are 136pt minimum and grow (no fixed height); icon + corner decoration are separate images", async () => {
    await render(<HomeBirdCornerSection onBirdOfTheDay={jest.fn()} onAskAi={jest.fn()} onBirdSoundLibrary={jest.fn()} />);
    const card = tree.root.findAll((n) => n.type === TouchableOpacity && n.props.testID === "home-corner-bird-of-the-day")[0];
    const box = card.findAllByType(View).find((v) => flat(v).minHeight === 136)!;
    expect(box).toBeDefined();
    expect(flat(box).height).toBeUndefined();
    const imgs = card.findAll((n) => (n.type as any) === "AppImage");
    expect(imgs.length).toBe(2);
    expect(imgs.some((i) => flat(i).position === "absolute" && flat(i).right === 0 && flat(i).bottom === 0)).toBe(true);
    expect(imgs.some((i) => flat(i).width === 36 && flat(i).height === 36)).toBe(true);
  });

  test("text limits: card title 3 lines, description 4; library row 72pt minimum, title 2 lines", async () => {
    await render(<HomeBirdCornerSection onBirdOfTheDay={jest.fn()} onAskAi={jest.fn()} onBirdSoundLibrary={jest.fn()} />);
    const card = tree.root.findAll((n) => n.type === TouchableOpacity && n.props.testID === "home-corner-ask-ai")[0];
    const [title, desc] = card.findAllByType(Text);
    expect(title.props.numberOfLines).toBe(3);
    expect(desc.props.numberOfLines).toBe(4);
    const lib = tree.root.findAll((n) => n.type === TouchableOpacity && n.props.testID === "home-corner-sound-library")[0];
    const row = lib.findAllByType(View).find((v) => flat(v).minHeight === 72)!;
    expect(row).toBeDefined();
    expect(flat(row).height).toBeUndefined();
    expect(lib.findAllByType(Text)[0].props.numberOfLines).toBe(2);
  });
});

describe("Our Other Apps card", () => {
  const card = (<AppOtherAppCard variant="horizontal" title="Banknote Identification AI" subtitle="Identify, track, evaluate and grow your collection." image={1 as any} />);

  test("default text: Figma 250pt row card", async () => {
    await render(card);
    const root = tree.root.findAllByType(View)[0];
    expect(flat(root)).toMatchObject({ flexDirection: "row", width: 250 });
  });

  test("large text: stacks (icon + Get on top, copy full width) and widens within the screen", async () => {
    mockDims.width = 360;
    mockDims.fontScale = 2;
    await render(card);
    const root = tree.root.findAllByType(View)[0];
    expect(flat(root).flexDirection).toBeUndefined();
    expect(flat(root).width).toBe(296);
    expect(byText("Banknote Identification AI").props.numberOfLines).toBe(3);
  });
});

describe("discount banners (light)", () => {
  test("50% OFF banner: grows with text (minHeight), Figma sizes with no width scaling, CTA may wrap", async () => {
    await render(<DiscountBanner hours={1} minutes={2} seconds={3} onSubscribe={jest.fn()} />);
    const wrapper = tree.root.findAllByType(View)[0];
    expect(flat(wrapper).height).toBeUndefined();
    expect(flat(wrapper).minHeight).toBeGreaterThan(0);
    // simulate a wide banner: light typography stays at Figma size
    await act(async () => wrapper.props.onLayout({ nativeEvent: { layout: { width: 500 } } }));
    expect(flat(byText("50%"))).toMatchObject({ fontSize: 32, lineHeight: 40 });
    const ends = texts().find((n) => String(n.props.children).startsWith("Discount ends"))!;
    expect(ends.props.adjustsFontSizeToFit).toBeUndefined();
    expect(ends.props.numberOfLines).toBe(2);
  });

  test("50% OFF banner art: 335:160 shape at the default banner height, bottom-right (never cropped or blown up)", async () => {
    await render(<DiscountBanner hours={1} minutes={2} seconds={3} onSubscribe={jest.fn()} />);
    const wrapper = tree.root.findAllByType(View)[0];
    const defaultHeight = flat(wrapper).minHeight;
    const art = tree.root.findAll((n) => (n.type as any) === "AppImage")[0];
    expect(flat(art)).toMatchObject({ position: "absolute", right: 0, bottom: 0, height: defaultHeight });
    expect(flat(art).width).toBeCloseTo((defaultHeight * 335) / 160);
  });

  test("sticky countdown: no height cap, timer wraps under the label, label keeps 14/20 on narrow phones", async () => {
    mockDims.width = 340;
    await render(<DiscountCountdownBanner hours={23} minutes={20} seconds={5} isDiscountActive onClose={jest.fn()} onPress={jest.fn()} />);
    const wrap = tree.root.findAllByType(View).find((v) => flat(v).minHeight === 44)!;
    expect(flat(wrap).maxHeight).toBeUndefined();
    const row = tree.root.findAllByType(View).find((v) => flat(v).flexWrap === "wrap")!;
    expect(row).toBeDefined();
    const label = texts().find((n) => n.props.numberOfLines === 3)!;
    expect(flat(label)).toMatchObject({ fontSize: 14, lineHeight: 20 });
  });
});
