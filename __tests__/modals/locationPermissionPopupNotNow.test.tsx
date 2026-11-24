import React from "react";
import TestRenderer, { act } from "react-test-renderer";

jest.mock("../../src/hooks/useTheme", () => ({
  useTheme: () => ({
    mode: "dark",
    colors: {
      surfaceSecondary: "#091421",
      textPrimary: "#fff",
      primaryCTA: "#16B6B4",
      onPrimary: "#091B21",
      border: "#333",
    },
    spacing: { 2: 8, 3: 12, 4: 16 },
    radius: { xl: 24 },
  }),
  useIsDark: () => true,
}));
jest.mock("../../src/atoms", () => {
  const { Text } = jest.requireActual("react-native");
  return { Text };
});
jest.mock("@/components/AppImage", () => ({ AppImage: () => null }));
jest.mock("@/components/shared/CloseIcon", () => ({ CloseIcon: () => null }));
jest.mock("../../src/design-system/modalTokens", () => ({
  getPopupChromeStyle: () => ({}),
}));
jest.mock("../../src/services/permissions/permissionUiCopy", () => ({
  getLocationFirstAskUiCopy: () => ({
    title: "Enable Location Access",
    subtitle: "subtitle",
    continueLabel: "Allow Location",
  }),
}));

import { TouchableOpacity } from "react-native";
import { LocationPermissionPopup } from "../../src/molecules/Modal/LocationPermissionPopup";

const labelled = (root: TestRenderer.ReactTestInstance, label: string) =>
  root.findAll(
    (n) => n.type === TouchableOpacity && n.props.accessibilityLabel === label
  );

test.each([true, false])(
  "Not Now is the last button and dismisses the popup (custom location shown: %s)",
  async (showCustomLocationButton) => {
    const onClose = jest.fn();
    const onAllowLocation = jest.fn();
    let renderer!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        <LocationPermissionPopup
          visible
          onClose={onClose}
          onAllowLocation={onAllowLocation}
          onCustomLocation={jest.fn()}
          showCustomLocationButton={showCustomLocationButton}
        />
      );
    });
    const [notNow] = labelled(renderer.root, "Not Now");
    expect(notNow).toBeDefined();
    const buttons = renderer.root.findAll(
      (n) => n.type === TouchableOpacity && n.parent?.parent !== null
    );
    expect(buttons[buttons.length - 1]).toBe(notNow);
    await act(async () => notNow.props.onPress());
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onAllowLocation).not.toHaveBeenCalled();
  }
);
