import { activateFreeScanPromptSurface } from "../../src/services/freeScanLimitPrompt";
let releasePromptSurface: () => void;
afterEach(() => releasePromptSurface?.());
jest.setTimeout(20000);
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import {
  InteractionManager,
  Modal,
  Platform,
  Pressable,
  Text,
} from "react-native";
import { FreeScanLimitDialog } from "../../src/components/shared/FreeScanLimitDialog";
import {
  requestFreeScanLimitPrompt,
  dismissFreeScanLimitPrompt,
} from "../../src/services/freeScanLimitPrompt";
jest.mock("../../src/assets/freeScanClose.svg", () => () => null);
let renderer: ReactTestRenderer;
const upgrade = jest.fn();
let settle: () => void;
const os = Platform.OS;
const visible = () => renderer.root.findByType(Modal).props.visible;
const press = async (label: string) =>
  act(async () => {
    renderer.root.findByProps({ accessibilityLabel: label }).props.onPress();
  });
async function mount(premium = false) {
  await act(async () => {
    renderer = create(
      <FreeScanLimitDialog active isPremium={premium} onUpgrade={upgrade} />
    );
  });
}
beforeEach(() => {
  releasePromptSurface = activateFreeScanPromptSurface();
  jest.useFakeTimers();
  jest.clearAllMocks();
  dismissFreeScanLimitPrompt();
  jest
    .spyOn(InteractionManager, "runAfterInteractions")
    .mockImplementation((callback) => {
      settle = callback as () => void;
      return { cancel: jest.fn() } as never;
    });
});
afterEach(async () => {
  await act(async () => renderer?.unmount());
  jest.restoreAllMocks();
  jest.useRealTimers();
  Object.defineProperty(Platform, "OS", { configurable: true, value: os });
});
it("does not show on first camera entry without an exhausted-limit request", async () => {
  await mount();
  expect(visible()).toBe(false);
});
it("waits for transitions before showing a blocked Submit request", async () => {
  requestFreeScanLimitPrompt();
  await mount();
  expect(visible()).toBe(false);
  await act(async () => settle());
  expect(visible()).toBe(true);
});
it("shows the Figma copy and can reopen after OK", async () => {
  requestFreeScanLimitPrompt();
  await mount();
  await act(async () => settle());
  expect(
    renderer.root
      .findAllByType(Text)
      .some(
        (node) =>
          node.props.children ===
          "You’ve used all 30 free scans. For unlimited scans, Go Premium"
      )
  ).toBe(true);
  await press("OK");
  expect(visible()).toBe(false);
  await act(async () => requestFreeScanLimitPrompt());
  await act(async () => settle());
  expect(visible()).toBe(true);
});
it("suppresses the popup for premium users", async () => {
  requestFreeScanLimitPrompt();
  await mount(true);
  expect(visible()).toBe(false);
});
it("opens the iOS paywall after dismissal only once", async () => {
  Object.defineProperty(Platform, "OS", { configurable: true, value: "ios" });
  requestFreeScanLimitPrompt();
  await mount();
  await act(async () => settle());
  await press("Go Premium");
  expect(upgrade).not.toHaveBeenCalled();
  await act(async () => renderer.root.findByType(Modal).props.onDismiss());
  await act(async () => renderer.root.findByType(Modal).props.onDismiss());
  expect(upgrade).toHaveBeenCalledTimes(1);
});
it("waits for the Android modal to close before opening premium", async () => {
  Object.defineProperty(Platform, "OS", {
    configurable: true,
    value: "android",
  });
  requestFreeScanLimitPrompt();
  await mount();
  await act(async () => settle());
  await press("Go Premium");
  expect(upgrade).not.toHaveBeenCalled();
  await act(async () => jest.advanceTimersByTime(350));
  expect(upgrade).toHaveBeenCalledTimes(1);
});

it("never opens a pending Submit popup on Home and requires a fresh Submit after returning", async () => {
  requestFreeScanLimitPrompt();
  await mount();
  await act(async () => {
    releasePromptSurface();
  });
  await act(async () => settle());
  expect(visible()).toBe(false);
  await act(async () => requestFreeScanLimitPrompt());
  expect(visible()).toBe(false);
  await act(async () => {
    releasePromptSurface = activateFreeScanPromptSurface();
  });
  expect(visible()).toBe(false);
  await act(async () => requestFreeScanLimitPrompt());
  await act(async () => settle());
  expect(visible()).toBe(true);
});
it("ignores a late allowance check that finishes after leaving the camera", async () => {
  releasePromptSurface();
  requestFreeScanLimitPrompt();
  await mount();
  expect(visible()).toBe(false);
});

it("shows the introduction even if camera interactions never settle and acknowledges native display only once", async () => {
  const acknowledge = jest.fn();
  requestFreeScanLimitPrompt(true, acknowledge);
  await mount();
  expect(visible()).toBe(false);
  expect(acknowledge).not.toHaveBeenCalled();
  await act(async () => {
    jest.advanceTimersByTime(600);
  });
  expect(visible()).toBe(true);
  expect(acknowledge).not.toHaveBeenCalled();
  await act(async () => renderer.root.findByType(Modal).props.onShow());
  await act(async () => renderer.root.findByType(Modal).props.onShow());
  expect(acknowledge).toHaveBeenCalledTimes(1);
});
