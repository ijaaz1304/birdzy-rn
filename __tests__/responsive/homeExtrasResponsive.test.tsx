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
jest.mock("../../src/assets", () => new Proxy({ Images: new Proxy({}, { get: () => 1 }) }, {
  get: (t: any, k) => (k in t ? t[k] : "SvgAsset"),
}));
jest.mock("react-native-vector-icons/MaterialIcons", () => "MaterialIcons");
jest.mock("react-native-vector-icons/Feather", () => "Feather");
jest.mock("react-native-vector-icons/Ionicons", () => "Ionicons");
jest.mock("react-native-vector-icons/MaterialCommunityIcons", () => "MaterialCommunityIcons");
jest.mock("react-native-vector-icons/FontAwesome5", () => "FontAwesome5");
jest.mock("react-native-gesture-handler", () => ({ Swipeable: ({ children }: any) => children }));
jest.mock("react-native-svg", () => ({ __esModule: true, default: "Svg", Path: "Path", Circle: "Circle", G: "G" }));

import AppOtherAppCard from "../../src/components/shared/AppOtherAppCard";
import { AudioGalleryCard } from "../../src/features/discovery/components/AudioGalleryCard";
import { WizardCalendar } from "../../src/features/discovery/components/WizardCalendar";

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
const textOf = (label: string) =>
  tree.root.findAllByType(Text).find((n) => [n.props.children].flat().join("") === label)!;

describe("Our Other Apps grid card (Figma 8015:142150)", () => {
  const card = (
    <AppOtherAppCard
      title="Coinzy-Coin AI Identification"
      subtitle="Discover, Identify, Track & Trade Coins"
      image={1 as any}
    />
  );

  test("Figma sizes: 12pt padding/gap, 196pt minimum (no fixed height), 40pt icon", async () => {
    await render(card);
    const root = tree.root.findAllByType(View)[0];
    expect(flat(root)).toMatchObject({ padding: 12, gap: 12, minHeight: 196, justifyContent: "flex-end" });
    expect(flat(root).height).toBeUndefined();
    const icon = tree.root.findAll((n) => (n.type as any) === "AppImage")[0];
    expect(flat(icon)).toMatchObject({ width: 40, height: 40 });
  });

  test("typography and line limits: title 16/24 (3 lines), description 12/16 (4 lines), Get app 14/20 (2 lines)", async () => {
    await render(card);
    const title = textOf("Coinzy-Coin AI Identification");
    expect(flat(title)).toMatchObject({ fontSize: 16, lineHeight: 24 });
    expect(title.props.numberOfLines).toBe(3);
    const desc = textOf("Discover, Identify, Track & Trade Coins");
    expect(flat(desc)).toMatchObject({ fontSize: 12, lineHeight: 16 });
    expect(desc.props.numberOfLines).toBe(4);
    const cta = textOf("Get app");
    expect(flat(cta)).toMatchObject({ fontSize: 14, lineHeight: 20 });
    expect(cta.props.numberOfLines).toBe(2);
    const button = tree.root.findAllByType(TouchableOpacity)[0];
    expect(flat(button).minHeight).toBe(28);
    expect(flat(button).height).toBeUndefined();
  });
});

describe("Our Other Apps single-column list", () => {
  test("no 196pt minimum when the grid is one column (card fits its content)", async () => {
    await render(<AppOtherAppCard title="Insecto AI" subtitle="Identify insects" image={1 as any} singleColumn />);
    const root = tree.root.findAllByType(View)[0];
    expect(flat(root).minHeight).toBeUndefined();
    expect(flat(root).height).toBeUndefined();
  });
});

describe("Bird Sound Library recording rows", () => {
  const item: any = {
    fileId: "f1",
    url: "https://x/a.m4a",
    createdAt: "2026-06-23T12:20:00Z",
    locationString: "San Francisco",
    specimen: { commonName: "House Sparrow", scientificName: "Passer domesticus" },
  };
  test("list title 2 lines (16/24), scientific name 2 lines, details 3 lines", async () => {
    await render(
      <AudioGalleryCard item={item} variant="identified" isPlaying={false} unknownTitle="Unknown"
        myRecordingLabel="My Recording" matchLabel="match" matchesLabel="matches" onPlay={jest.fn()} />
    );
    const title = textOf("House Sparrow");
    expect(title.props.numberOfLines).toBe(2);
    expect(flat(title)).toMatchObject({ fontSize: 16, lineHeight: 24 });
    expect(textOf("Passer domesticus").props.numberOfLines).toBe(2);
    const meta = tree.root.findAllByType(Text).find((n) => String(n.props.children).includes("San Francisco"))!;
    expect(meta.props.numberOfLines).toBe(3);
  });
});

describe("Step-by-step date calendar", () => {
  test("day cells keep a 44pt minimum and grow (no fixed/max height); weekdays share the row", async () => {
    mockDims.fontScale = 2;
    await render(<WizardCalendar selectedIso={null} onSelect={jest.fn()} onResetToday={jest.fn()} resetLabel="Reset to Today" />);
    const days = tree.root.findAllByType(TouchableOpacity).filter((n) => flat(n).minHeight === 44);
    expect(days.length).toBeGreaterThanOrEqual(28);
    for (const d of days.slice(0, 3)) {
      expect(flat(d).height).toBeUndefined();
      expect(flat(d).maxHeight).toBeUndefined();
      expect(flat(d).aspectRatio).toBeUndefined();
    }
    const weekday = textOf("Mon");
    expect(flat(weekday).flex).toBe(1);
    expect(weekday.props.numberOfLines).toBe(1);
    // every week is its own row of exactly 7 cells (no early wrap at large text)
    const weekRows = tree.root.findAll((n) => n.type === View && flat(n).flexDirection === "row" &&
      Array.isArray(n.props.children) && n.props.children.length === 7 &&
      n.props.children.every((c: any) => StyleSheet.flatten(c.props.style)?.flex === 1));
    expect(weekRows.length).toBeGreaterThanOrEqual(4);
    // 360pt phone at 2× text: "Wed" can't fit 1/7 of the row → 2-letter labels, never "W…"
    const weekRow = tree.root.findAll((n) => n.type === View && typeof n.props.onLayout === "function")[0];
    await act(async () => weekRow.props.onLayout({ nativeEvent: { layout: { width: 278 } } }));
    expect(textOf("Mo")).toBeDefined();
    expect(tree.root.findAllByType(Text).some((n) => n.props.children === "Mon")).toBe(false);
  });
});
