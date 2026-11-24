import React from "react";
import TestRenderer, { act } from "react-test-renderer";

const mockTheme = { mode: "dark" as "dark" | "light" };
const mockNavigateToSoundIdentify = jest.fn();

jest.mock("../../src/hooks/useTheme", () => ({
  useTheme: () => ({
    mode: mockTheme.mode,
    colors: {
      surfacePrimary: "#091B21",
      textPrimary: "#FFFFFF",
      border0: "#333333",
      primaryCTA: "#16B6B4",
    },
  }),
}));
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ goBack: jest.fn(), navigate: jest.fn() }),
}));
jest.mock("react-native-safe-area-context", () => {
  const { View } = jest.requireActual("react-native");
  return {
    SafeAreaView: View,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});
jest.mock("../../src/atoms", () => {
  const { Text } = jest.requireActual("react-native");
  return { Text, NavBackIcon: () => null };
});
jest.mock("../../src/molecules", () => ({
  SearchBar: () => null,
  ConfirmationModal: () => null,
}));
jest.mock("../../src/assets", () => ({
  Images: { soundLibraryEmptyBird: 1 },
  CreatePlusIcon: (props: { color: string }) => {
    const { View } = jest.requireActual("react-native");
    const ReactActual = jest.requireActual("react");
    return ReactActual.createElement(View, { testID: "plus", ...props });
  },
  SoundLibraryFilterIcon: () => null,
}));
jest.mock("@/components/AppImage", () => {
  const { View } = jest.requireActual("react-native");
  const ReactActual = jest.requireActual("react");
  return {
    AppImage: (props: object) =>
      ReactActual.createElement(View, { testID: "emptyArt", ...props }),
  };
});
jest.mock("../../src/services/archetype/archetype.service", () => ({
  archetypeService: {
    getGalleryAudio: jest.fn().mockResolvedValue({
      identified: { files: [] },
      unknown: { files: [] },
    }),
  },
}));
jest.mock("../../src/services/audio/soundRecording.service", () => ({
  soundRecordingService: { stopPlayback: jest.fn() },
}));
jest.mock("../../src/utils/navigation", () => ({
  navigateToSoundIdentify: (...a: unknown[]) => mockNavigateToSoundIdentify(...a),
  navigateToSubscriptionMain: jest.fn(),
}));
jest.mock("../../src/features/subscription/subscription.store", () => ({
  useSubscriptionStore: () => false,
  selectIsPremium: () => false,
}));
jest.mock("../../src/features/discovery/components/AudioGalleryCard", () => ({
  AudioGalleryCard: () => null,
  clipDisplayName: () => "",
  getClipTimestamp: () => 0,
}));
jest.mock("../../src/features/discovery/components/AudioGalleryCardMenu", () => ({
  AudioGalleryCardMenu: () => null,
}));
jest.mock("../../src/features/discovery/components/RecordingLimitBanner", () => ({
  RecordingLimitBanner: () => null,
}));

import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { AudioGalleryScreen } from "../../src/features/discovery/screens/AudioGalleryScreen";

const render = async () => {
  let renderer!: TestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = TestRenderer.create(<AudioGalleryScreen />);
  });
  return renderer;
};
const textNode = (r: TestRenderer.ReactTestRenderer, value: string) =>
  r.root.findAll((n) => n.type === Text && n.props.children === value)[0];
const cta = (r: TestRenderer.ReactTestRenderer) =>
  r.root.findAll(
    (n) =>
      n.type === TouchableOpacity &&
      n.props.accessibilityLabel === "Identify by Sound"
  )[0];

beforeEach(() => mockNavigateToSoundIdentify.mockReset());

test("dark empty library uses the Figma colours and the button opens Sound ID", async () => {
  mockTheme.mode = "dark";
  const r = await render();
  expect(StyleSheet.flatten(textNode(r, "No recordings yet").props.style).color).toBe("#FFFFFF");
  expect(
    StyleSheet.flatten(
      textNode(r, "Record bird sounds using Sound ID and save them here for future reference.").props.style
    ).color
  ).toBe("#D1D1D1");
  const button = cta(r);
  expect(StyleSheet.flatten(button.props.style).backgroundColor).toBe("#072C38");
  expect(StyleSheet.flatten(textNode(r, "Identify by Sound").props.style).color).toBe("#16B6B4");
  expect(r.root.findByProps({ testID: "plus" }).props.color).toBe("#16B6B4");
  await act(async () => button.props.onPress());
  expect(mockNavigateToSoundIdentify).toHaveBeenCalledTimes(1);
});

test("the bird is drawn 185×185 inside the 219×168 frame, as in Figma", async () => {
  mockTheme.mode = "dark";
  const r = await render();
  const art = r.root.findByProps({ testID: "emptyArt" });
  expect(StyleSheet.flatten(art.props.style)).toMatchObject({
    width: 185,
    height: 185,
    left: 17,
    top: 6,
  });
  const frame = r.root.find(
    (n) =>
      typeof n.type === "string" &&
      StyleSheet.flatten(n.props.style)?.width === 219
  );
  expect(StyleSheet.flatten(frame.props.style)).toMatchObject({
    width: 219,
    height: 168,
    overflow: "hidden",
  });
  // The bird sits inside that clipping frame.
  expect(frame.findAll((n) => n.props.testID === "emptyArt").length).toBeGreaterThan(0);
});

test("light mode keeps its existing button colours", async () => {
  mockTheme.mode = "light";
  const r = await render();
  expect(StyleSheet.flatten(cta(r).props.style).backgroundColor).toBe("#F5EBEB");
  expect(StyleSheet.flatten(textNode(r, "Identify by Sound").props.style).color).toBe("#402122");
});
