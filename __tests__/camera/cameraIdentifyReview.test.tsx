import React from "react";
import { StyleSheet, View } from "react-native";
import { act, create, ReactTestRenderer } from "react-test-renderer";
import { CameraIdentifyReview } from "../../src/features/camera/components/CameraIdentifyReview";
import { ThemeContext } from "../../src/app/ThemeProvider";
import { themes } from "../../src/design-system/themes";
import type { CroppedImageObject } from "../../src/features/camera/cropImageAndReturnObject";

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 47, bottom: 34, left: 0, right: 0 }),
}));

jest.mock("../../src/components/AppImage", () => ({ AppImage: "AppImage" }));
jest.mock("../../src/atoms", () => ({ Text: "Text" }));
jest.mock("../../src/features/camera/components/CameraImageSlots", () => ({
  CameraImageSlots: "CameraImageSlots",
}));

const image: CroppedImageObject = {
  uri: "file://bird.jpg",
  previewUri: "file://bird.jpg",
  fileName: "bird.jpg",
  type: "image/jpeg",
};

const props = {
  images: [image],
  addAnotherLabel: "Add Another Photo",
  identifyLabel: "Identify Bird",
  imageCounterLabel: (current: number, max: number) => `${current}/${max}`,
  submitToastLabel: () => "Photo added",
  onRemove: jest.fn(),
  onAddAnother: jest.fn(),
  onIdentify: jest.fn(),
};

it.each(["light", "dark"] as const)(
  "keeps the photo and slot previews below the location banner in %s mode",
  async (mode) => {
    const topInset = 222;
    let renderer: ReactTestRenderer;
    await act(async () => {
      renderer = create(
        <ThemeContext.Provider
          value={{
            theme: themes[mode],
            themeMode: mode,
            setThemeMode: jest.fn(),
          }}
        >
          <CameraIdentifyReview {...props} topInset={topInset} />
        </ThemeContext.Provider>
      );
    });

    const content = renderer!.root.findAllByType(View).find((node) => {
      const style = StyleSheet.flatten(node.props.style);
      return style?.paddingTop === topInset;
    });
    expect(content).toBeTruthy();

    const toast = renderer!.root.findAllByType(View).find((node) => {
      const style = StyleSheet.flatten(node.props.style);
      return style?.top === topInset - 56;
    });
    expect(toast).toBeTruthy();

    await act(async () => {
      renderer!.unmount();
    });
  }
);

it.each(["light", "dark"] as const)(
  "lifts the CTAs above the native gesture inset in %s mode",
  async (mode) => {
    let renderer: ReactTestRenderer;
    await act(async () => {
      renderer = create(
        <ThemeContext.Provider
          value={{
            theme: themes[mode],
            themeMode: mode,
            setThemeMode: jest.fn(),
          }}
        >
          <CameraIdentifyReview {...props} />
        </ThemeContext.Provider>
      );
    });

    const content = renderer!.root.findAllByType(View).find((node) => {
      const style = StyleSheet.flatten(node.props.style);
      return (
        typeof style?.paddingBottom === "number" && style.paddingBottom > 34
      );
    });
    expect(content).toBeTruthy();
    expect(StyleSheet.flatten(content!.props.style).paddingBottom).toBe(50);

    await act(async () => {
      renderer!.unmount();
    });
  }
);
