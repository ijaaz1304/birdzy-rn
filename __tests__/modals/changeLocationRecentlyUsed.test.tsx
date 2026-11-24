import React from "react";
import TestRenderer, { act } from "react-test-renderer";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);
jest.mock("../../src/components/AppSheet/AppSheet", () => ({
  AppSheet: ({ visible, payload }: { visible: boolean; payload: { title: string; children: React.ReactNode } }) => {
    const { View, Text } = jest.requireActual("react-native");
    const ReactActual = jest.requireActual("react");
    return visible
      ? ReactActual.createElement(View, null, ReactActual.createElement(Text, null, payload.title), payload.children)
      : null;
  },
}));
jest.mock("../../src/components/AppSheet/SheetPreviewContext", () => ({
  useSheetPreview: () => false,
}));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock("../../src/hooks/useTheme", () => ({
  useTheme: () => ({
    mode: "dark",
    colors: {
      textPrimary: "#fff",
      textSecondary: "#D1D1D1",
      textTertiary: "#949494",
      border0: "#333",
      border: "#333",
      borderBrand: "#16B6B4",
      surface: "#091B21",
      textFieldBackground: "#091421",
      primary: "#16B6B4",
    },
  }),
}));
jest.mock("../../src/atoms", () => {
  const { Text } = jest.requireActual("react-native");
  return { Text };
});
jest.mock("../../src/assets", () => ({
  LocationPinpointIcon: () => null,
  LocationRecentIcon: () => null,
}));
const mockSearch = jest.fn();
jest.mock("../../src/features/explore/utils/geocodingApi", () => ({
  searchAddressSuggestions: (...args: unknown[]) => mockSearch(...args),
  geocodeAddress: jest.fn(),
}));

import { Text, TouchableOpacity } from "react-native";
import { ChangeLocationBottomSheet } from "../../src/molecules/Modal/ChangeLocationBottomSheet";
import {
  MAX_RECENT_CUSTOM_LOCATIONS,
  useRecentCustomLocationsStore,
} from "../../src/features/location/recentCustomLocations.store";

const sf = { label: "San Francisco", latitude: 37.77, longitude: -122.42 };
const blr = { label: "Bengaluru, Karnataka", latitude: 12.97, longitude: 77.59 };

const texts = (root: TestRenderer.ReactTestInstance) =>
  root.findAllByType(Text).map((t) => String(t.props.children));

beforeEach(() => {
  jest.useFakeTimers();
  useRecentCustomLocationsStore.getState().clear();
  mockSearch.mockReset().mockResolvedValue([]);
});
afterEach(() => jest.useRealTimers());

describe("recent custom locations store", () => {
  test("keeps newest first, collapses repeats and caps the list", () => {
    const { remember } = useRecentCustomLocationsStore.getState();
    remember(sf);
    remember(blr);
    remember({ ...sf });
    expect(useRecentCustomLocationsStore.getState().recent.map((r) => r.label)).toEqual([
      "San Francisco",
      "Bengaluru, Karnataka",
    ]);
    for (let i = 0; i < 10; i++)
      remember({ label: `Place ${i}`, latitude: i + 1, longitude: i + 1 });
    expect(useRecentCustomLocationsStore.getState().recent).toHaveLength(
      MAX_RECENT_CUSTOM_LOCATIONS
    );
  });

  test("does not keep places that could not be resolved", () => {
    useRecentCustomLocationsStore
      .getState()
      .remember({ label: "Somewhere", latitude: 0, longitude: 0 });
    expect(useRecentCustomLocationsStore.getState().recent).toEqual([]);
  });
});

describe("Add Custom Location sheet search", () => {
  test("with three letters, a newer query replaces an older slow search", async () => {
    let resolveFirst!: (value: unknown[]) => void;
    mockSearch
      .mockImplementationOnce(
        () => new Promise((resolve) => (resolveFirst = resolve))
      )
      .mockResolvedValueOnce([
        {
          placeId: "new",
          name: "Bengaluru",
          formattedAddress: "Bengaluru, Karnataka",
          location: { latitude: 12.97, longitude: 77.59 },
        },
      ]);
    let renderer!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        <ChangeLocationBottomSheet visible variant="add" onConfirm={jest.fn()} onClose={jest.fn()} />
      );
    });
    const input = renderer.root.findByProps({ placeholder: "Enter location" });
    await act(async () => input.props.onChangeText("Ben"));
    await act(async () => {
      await jest.advanceTimersByTimeAsync(350);
    });
    const firstSignal = mockSearch.mock.calls[0][1].signal as AbortSignal;
    await act(async () => input.props.onChangeText("Beng"));
    expect(firstSignal.aborted).toBe(true);
    await act(async () => {
      await jest.advanceTimersByTimeAsync(350);
    });
    // The stale first response arrives late and must be ignored.
    await act(async () =>
      resolveFirst([
        {
          placeId: "old",
          name: "Benin",
          formattedAddress: "Benin",
          location: { latitude: 9.3, longitude: 2.3 },
        },
      ])
    );
    const shown = texts(renderer.root);
    expect(shown).toContain("Bengaluru, Karnataka");
    expect(shown).not.toContain("Benin");
    await act(async () => renderer.unmount());
  });

  const typeAndWait = async (
    renderer: TestRenderer.ReactTestRenderer,
    text: string
  ) => {
    const input = renderer.root.findByProps({ placeholder: "Enter location" });
    await act(async () => input.props.onChangeText(text));
    await act(async () => {
      await jest.advanceTimersByTimeAsync(350);
    });
  };

  test("no matches shows 'No location found.' in place of Recently Used", async () => {
    useRecentCustomLocationsStore.getState().remember(sf);
    mockSearch.mockResolvedValue([]);
    let renderer!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        <ChangeLocationBottomSheet visible variant="add" onConfirm={jest.fn()} onClose={jest.fn()} />
      );
    });
    expect(texts(renderer.root)).toContain("Recently Used");
    await typeAndWait(renderer, "Benluuuu");
    expect(mockSearch).toHaveBeenCalledWith(
      "Benluuuu",
      expect.objectContaining({ throwOnError: true })
    );
    let shown = texts(renderer.root);
    expect(shown).toContain("No location found.");
    expect(shown).not.toContain("Recently Used");

    // Editing the text hides the old answer until the new search finishes.
    const input = renderer.root.findByProps({ placeholder: "Enter location" });
    await act(async () => input.props.onChangeText("Benluuuu2"));
    expect(texts(renderer.root)).not.toContain("No location found.");

    // Clearing back below three letters brings Recently Used back.
    await typeAndWait(renderer, "Be");
    shown = texts(renderer.root);
    expect(shown).not.toContain("No location found.");
    expect(shown).toContain("Recently Used");
    await act(async () => renderer.unmount());
  });

  test("a failed search says so instead of claiming nothing was found", async () => {
    mockSearch.mockRejectedValue(new Error("Network request failed"));
    let renderer!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        <ChangeLocationBottomSheet visible variant="add" onConfirm={jest.fn()} onClose={jest.fn()} />
      );
    });
    await typeAndWait(renderer, "Chennai");
    const shown = texts(renderer.root);
    expect(shown).toContain(
      "Couldn't search locations. Check your connection and try again."
    );
    expect(shown).not.toContain("No location found.");
    await act(async () => renderer.unmount());
  });

  test("fewer than three letters does not search", async () => {
    let renderer!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        <ChangeLocationBottomSheet visible variant="add" onConfirm={jest.fn()} onClose={jest.fn()} />
      );
    });
    const input = renderer.root.findByProps({ placeholder: "Enter location" });
    await act(async () => input.props.onChangeText("Be"));
    await act(async () => {
      await jest.advanceTimersByTimeAsync(350);
    });
    expect(mockSearch).not.toHaveBeenCalled();
    await act(async () => renderer.unmount());
  });
});

describe("Add Custom Location sheet", () => {
  const render = async (onConfirm = jest.fn(), onClose = jest.fn()) => {
    let renderer!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        <ChangeLocationBottomSheet
          visible
          variant="add"
          onConfirm={onConfirm}
          onClose={onClose}
        />
      );
    });
    return renderer;
  };

  test("shows the Figma title, field label and no Recently Used without history", async () => {
    const renderer = await render();
    const shown = texts(renderer.root);
    expect(shown).toContain("Add Custom Location");
    expect(shown).toContain("Custom Location");
    expect(shown).not.toContain("Recently Used");
    await act(async () => renderer.unmount());
  });

  test("lists recent places and confirms one when tapped", async () => {
    useRecentCustomLocationsStore.getState().remember(blr);
    useRecentCustomLocationsStore.getState().remember(sf);
    const onConfirm = jest.fn();
    const onClose = jest.fn();
    const renderer = await render(onConfirm, onClose);
    expect(texts(renderer.root)).toContain("Recently Used");
    const rows = renderer.root
      .findAllByType(TouchableOpacity)
      .filter((n) => [sf.label, blr.label].includes(n.props.accessibilityLabel));
    expect(rows.map((r) => r.props.accessibilityLabel)).toEqual([sf.label, blr.label]);
    await act(async () => rows[1].props.onPress());
    expect(onConfirm).toHaveBeenCalledWith({
      latitude: blr.latitude,
      longitude: blr.longitude,
      address: blr.label,
    });
    expect(onClose).toHaveBeenCalled();
    // Re-used place moves to the top.
    expect(useRecentCustomLocationsStore.getState().recent[0].label).toBe(blr.label);
    await act(async () => renderer.unmount());
  });

  test("choosing a search suggestion saves it as recently used", async () => {
    mockSearch.mockResolvedValue([
      {
        placeId: "p1",
        name: "Chennai",
        formattedAddress: "Chennai, Tamil Nadu",
        location: { latitude: 13.08, longitude: 80.27 },
      },
    ]);
    const onConfirm = jest.fn();
    const renderer = await render(onConfirm);
    const input = renderer.root.findByProps({ placeholder: "Enter location" });
    await act(async () => input.props.onChangeText("Chen"));
    await act(async () => {
      await jest.advanceTimersByTimeAsync(350);
    });
    // Three letters are enough to search, with a cancellable request.
    expect(mockSearch).toHaveBeenCalledWith(
      "Chen",
      expect.objectContaining({ signal: expect.any(Object) })
    );
    expect(texts(renderer.root)).not.toContain("Recently Used");
    const suggestion = renderer.root
      .findAllByType(TouchableOpacity)
      .find((n) =>
        n.findAllByType(Text).some((t) => t.props.children === "Chennai, Tamil Nadu")
      )!;
    await act(async () => suggestion.props.onPress());
    expect(onConfirm).toHaveBeenCalledWith({
      latitude: 13.08,
      longitude: 80.27,
      address: "Chennai, Tamil Nadu",
    });
    expect(useRecentCustomLocationsStore.getState().recent[0].label).toBe(
      "Chennai, Tamil Nadu"
    );
    await act(async () => renderer.unmount());
  });
});
