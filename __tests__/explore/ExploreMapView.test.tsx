import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { NativeModules, Text } from "react-native";
jest.mock("../../src/atoms", () => ({ Text: require("react-native").Text }));
jest.mock("../../src/hooks/useTheme", () => ({ useTheme: () => ({ colors: { surfacePrimary: "white" } }) }));
const mockNativeMap = jest.fn((_props: unknown) => null);
jest.mock("../../src/features/explore/components/ExploreMapView.nativeMap", () => ({ ExploreMapView: (props: unknown) => mockNativeMap(props) }));
import { ExploreMapView } from "../../src/features/explore/components/ExploreMapView";
let renderer: ReactTestRenderer;
const previousModule = NativeModules.RNMBXModule;
afterEach(async () => {
  await act(async () => renderer?.unmount());
  NativeModules.RNMBXModule = previousModule;
  mockNativeMap.mockClear();
});
test("an older native binary displays recovery without loading the SDK-backed map", async () => {
  NativeModules.RNMBXModule = undefined;
  await act(async () => { renderer = create(<ExploreMapView />); });
  expect(mockNativeMap).not.toHaveBeenCalled();
  expect(renderer.root.findAllByType(Text).map((node) => node.props.children)).toContain("Map unavailable in this app version");
});
test("a linked binary forwards map inputs to native rendering", async () => {
  NativeModules.RNMBXModule = {};
  const center: [number, number] = [80.27, 13.08];
  await act(async () => { renderer = create(<ExploreMapView center={center} instant />); });
  expect(mockNativeMap).toHaveBeenCalledWith(expect.objectContaining({ center, instant: true }));
});
