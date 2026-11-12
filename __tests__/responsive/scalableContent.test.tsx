import React from "react";
import { act, create, ReactTestRenderer } from "react-test-renderer";
import { Text, TouchableOpacity, StyleSheet } from "react-native";
import { Button } from "../../src/atoms/Button/Button";
import { BirdSoundRow } from "../../src/features/collection/components/BirdSoundRow";
import { CameraPermissionInlineState } from "../../src/features/camera/components/CameraPermissionInlineState";

jest.mock("../../src/atoms", () => ({ Text: require("react-native").Text }));
jest.mock("../../src/assets", () => ({
  SoundLibraryPlayIcon: () => null,
  CameraTakePhotoIllustrationSvg: () => null,
}));
jest.mock("../../src/features/collection/hooks/usePlayingCountdown", () => ({
  usePlayingCountdown: (_playing: boolean, duration?: number) => duration,
}));
jest.mock("../../src/services/permissions/permissionUiCopy", () => ({
  getCameraPermissionUiCopy: () => ({
    deniedTitle: "Allow camera access in device settings",
    deniedSubtitle:
      "Birdzy needs camera access to identify a bird from a photograph.",
    openSettingsLabel: "Open device settings to allow camera access",
    allowAccessLabel: "Allow camera access",
  }),
}));
jest.mock("../../src/hooks/useTheme", () => ({
  useTheme: () => ({
    radius: { button: 24 },
    spacing: { 2: 8, 3: 12, 4: 16, 6: 24 },
    colors: {
      text: "#111",
      onPrimary: "#fff",
      primaryCTA: "#725481",
      border0: "#ddd",
    },
    typography: {
      body: {
        large: { fontSize: 16, lineHeight: 24 },
        medium: { fontSize: 14, lineHeight: 20 },
      },
    },
  }),
}));
let tree: ReactTestRenderer;
afterEach(async () => {
  if (tree) await act(async () => tree.unmount());
});
test("shared action labels wrap at the requested font size while presses and disabled behavior remain intact", async () => {
  const onPress = jest.fn();
  const title = "Continue with this selected subscription and billing period";
  await act(async () => {
    tree = create(<Button title={title} onPress={onPress} />);
  });
  const label = tree.root.findByType(Text);
  expect(label.props.children).toBe(title);
  expect(label.props.allowFontScaling).toBe(true);
  expect(label.props.numberOfLines).toBeUndefined();
  expect(label.props.adjustsFontSizeToFit).not.toBe(true);
  expect(StyleSheet.flatten(label.props.style).flexShrink).toBe(1);
  await act(async () => tree.root.findByType(TouchableOpacity).props.onPress());
  expect(onPress).toHaveBeenCalledTimes(1);
  await act(async () => {
    tree.update(<Button title={title} onPress={onPress} disabled />);
  });
  expect(tree.root.findByType(TouchableOpacity).props.disabled).toBe(true);
});

test("sound recordings retain the full title and metadata without scaling opt-outs", async () => {
  const onPress = jest.fn();
  const title = "Long recording title for an unidentified bird singing nearby";
  const metaLine = "Recorded near a long location name, November 12 at 10:30";
  await act(async () => {
    tree = create(
      <BirdSoundRow
        item={{
          id: "1",
          url: "https://example.com/bird.mp3",
          title,
          metaLine,
          durationSec: 90,
          durationLabel: "01:30",
          isUserRecording: true,
        }}
        isPlaying={false}
        onPress={onPress}
        surfaceSecondary="#fff"
        textPrimary="#111"
        textSecondary="#555"
      />
    );
  });
  const labels = tree.root.findAllByType(Text);
  expect(labels.map((node) => node.props.children)).toEqual(
    expect.arrayContaining([title, metaLine, "01:30"])
  );
  labels.forEach((node) => {
    expect(node.props.allowFontScaling).not.toBe(false);
    expect(node.props.numberOfLines).toBeUndefined();
  });
  await act(async () => tree.root.findByType(TouchableOpacity).props.onPress());
  expect(onPress).toHaveBeenCalledTimes(1);
});

test("camera settings explanation and action can enlarge and wrap, including the busy state", async () => {
  const onAction = jest.fn();
  await act(async () => {
    tree = create(
      <CameraPermissionInlineState variant="goToSettings" onAction={onAction} />
    );
  });
  const labels = tree.root.findAllByType(Text);
  expect(labels).toHaveLength(3);
  labels.forEach((node) => {
    expect(node.props.allowFontScaling).not.toBe(false);
    expect(node.props.numberOfLines).toBeUndefined();
  });
  await act(async () => tree.root.findByType(TouchableOpacity).props.onPress());
  expect(onAction).toHaveBeenCalledTimes(1);
  await act(async () => {
    tree.update(
      <CameraPermissionInlineState
        variant="goToSettings"
        loading
        onAction={onAction}
      />
    );
  });
  expect(
    tree.root.findByType(TouchableOpacity).props.accessibilityState
  ).toEqual({ disabled: true, busy: true });
});
