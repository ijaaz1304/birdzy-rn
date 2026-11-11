import React from "react";
import { AppState } from "react-native";
import TestRenderer, { act } from "react-test-renderer";

const mockCheck = jest.fn();
const mockFocus = { current: true };
const appListeners: Array<(state: string) => void> = [];

jest.mock("@react-navigation/native", () => ({
  useIsFocused: () => mockFocus.current,
}));
jest.mock("../../src/services/permissions/permission.service", () => ({
  checkLocationPermission: (...args: unknown[]) => mockCheck(...args),
}));

import { useLocationPermissionGranted } from "../../src/features/explore/useLocationPermissionGranted";

let granted: boolean | null;
const Probe = () => {
  granted = useLocationPermissionGranted();
  return null;
};

beforeEach(() => {
  jest.clearAllMocks();
  mockFocus.current = true;
  appListeners.length = 0;
  mockCheck.mockResolvedValue({ granted: false });
  jest.spyOn(AppState, "addEventListener").mockImplementation((_event, cb) => {
    appListeners.push(cb as (state: string) => void);
    return { remove: jest.fn() } as never;
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

test("starts as null until the first permission check finishes", async () => {
  let resolveCheck: (value: { granted: boolean }) => void = () => undefined;
  mockCheck.mockImplementation(
    () =>
      new Promise<{ granted: boolean }>((resolve) => {
        resolveCheck = resolve;
      })
  );
  await act(async () => {
    TestRenderer.create(<Probe />);
  });
  expect(granted).toBeNull();
  await act(async () => {
    resolveCheck({ granted: true });
  });
  expect(granted).toBe(true);
});

test("refreshes when the screen is focused", async () => {
  mockFocus.current = false;
  await act(async () => {
    TestRenderer.create(<Probe />);
  });
  expect(mockCheck).not.toHaveBeenCalled();
  mockFocus.current = true;
  await act(async () => {
    TestRenderer.create(<Probe />);
  });
  expect(mockCheck).toHaveBeenCalled();
});

test("refreshes when the app returns to the foreground", async () => {
  await act(async () => {
    TestRenderer.create(<Probe />);
  });
  mockCheck.mockClear();
  mockCheck.mockResolvedValue({ granted: true });
  await act(async () => {
    appListeners.forEach((listener) => listener("active"));
  });
  expect(mockCheck).toHaveBeenCalled();
  expect(granted).toBe(true);
});
