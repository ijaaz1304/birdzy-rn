import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { AppState, InteractionManager, Modal } from "react-native";
import { useFreeScanPromptSurface } from "../../src/hooks/useFreeScanPromptSurface";
import { FreeScanLimitDialog } from "../../src/components/shared/FreeScanLimitDialog";
import {
  requestFreeScanLimitPrompt,
  dismissFreeScanLimitPrompt,
} from "../../src/services/freeScanLimitPrompt";
jest.mock("../../src/assets/freeScanClose.svg", () => () => null);
let renderer: ReactTestRenderer;
let onAppState: (state: string) => void;
function Camera({ focused }: { focused: boolean }) {
  useFreeScanPromptSurface(focused);
  return null;
}
function Root({
  camera,
  mounted = true,
}: {
  camera: boolean;
  mounted?: boolean;
}) {
  return (
    <>
      {mounted && <Camera focused={camera} />}
      <FreeScanLimitDialog active isPremium={false} onUpgrade={jest.fn()} />
    </>
  );
}
const visible = () => renderer.root.findByType(Modal).props.visible;
async function render(camera: boolean, mounted = true) {
  await act(async () => {
    if (renderer) renderer.update(<Root camera={camera} mounted={mounted} />);
    else renderer = create(<Root camera={camera} mounted={mounted} />);
  });
}
beforeEach(() => {
  dismissFreeScanLimitPrompt();
  Object.defineProperty(AppState, "currentState", {
    configurable: true,
    value: "active",
  });
  jest
    .spyOn(AppState, "addEventListener")
    .mockImplementation((_, callback: any) => {
      onAppState = callback;
      return { remove: jest.fn() };
    });
  jest
    .spyOn(InteractionManager, "runAfterInteractions")
    .mockImplementation((callback) => {
      if (typeof callback === 'function') callback();
      return { cancel: jest.fn() } as never;
    });
});
afterEach(async () => {
  await act(async () => renderer?.unmount());
  renderer = undefined as never;
  jest.restoreAllMocks();
});
it("only shows after Submit on the focused camera and clears on navigation Home", async () => {
  await render(false);
  await act(async () => requestFreeScanLimitPrompt());
  expect(visible()).toBe(false);
  await render(true);
  expect(visible()).toBe(false);
  await act(async () => requestFreeScanLimitPrompt());
  expect(visible()).toBe(true);
  await render(false);
  expect(visible()).toBe(false);
  await act(async () => requestFreeScanLimitPrompt());
  expect(visible()).toBe(false);
  await render(true);
  expect(visible()).toBe(false);
});
it("clears pending requests when backgrounded and does not reopen on resume", async () => {
  await render(true);
  await act(async () => requestFreeScanLimitPrompt());
  expect(visible()).toBe(true);
  await act(async () => onAppState("background"));
  expect(visible()).toBe(false);
  await act(async () => requestFreeScanLimitPrompt());
  await act(async () => onAppState("active"));
  expect(visible()).toBe(false);
  await act(async () => requestFreeScanLimitPrompt());
  expect(visible()).toBe(true);
});
it("clears the popup when the camera unmounts while the global host stays mounted", async () => {
  await render(true);
  await act(async () => requestFreeScanLimitPrompt());
  expect(visible()).toBe(true);
  await render(false, false);
  expect(visible()).toBe(false);
});
