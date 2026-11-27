import React from "react";
import TestRenderer, { act } from "react-test-renderer";

const mockNativeLeaves = jest.fn();
jest.mock("@/constants/env", () => ({ MAPBOX_ACCESS_TOKEN: "pk.test" }));
jest.mock("@rnmapbox/maps", () => {
  const { View } = jest.requireActual("react-native");
  const ReactActual = jest.requireActual("react");
  const Passthrough = ({ children }: { children?: React.ReactNode }) =>
    ReactActual.createElement(View, null, children);
  const Camera = ReactActual.forwardRef(() => null);
  const ShapeSource = ReactActual.forwardRef(
    (props: { children?: React.ReactNode }, ref: unknown) => {
      ReactActual.useImperativeHandle(ref, () => ({
        getClusterLeaves: mockNativeLeaves,
      }));
      return ReactActual.createElement(View, props, props.children);
    }
  );
  return {
    __esModule: true,
    default: {
      setAccessToken: jest.fn(),
      StyleURL: { Dark: "d", Street: "s" },
    },
    MapView: Passthrough,
    Camera,
    ShapeSource,
    CircleLayer: () => null,
    SymbolLayer: () => null,
    PointAnnotation: Passthrough,
  };
});
jest.mock("../../src/features/explore/assets", () => {
  const Svg = () => null;
  return new Proxy({}, { get: () => Svg });
});
jest.mock("react-native-safe-area-context", () => {
  const { View } = jest.requireActual("react-native");
  return { SafeAreaView: View };
});
jest.mock("../../src/hooks/useTheme", () => ({
  useTheme: () => ({
    mode: "light",
    colors: {
      surfacePrimary: "#fff",
      border0: "#e7e7e7",
      background: "#fff",
      textPrimary: "#111",
      primary: "#725481",
    },
  }),
  useIsDark: () => false,
}));
jest.mock("../../src/atoms", () => {
  const { Text } = jest.requireActual("react-native");
  return { Text, Icon: () => null };
});

import { ShapeSource } from "@rnmapbox/maps";
import { Modal, TouchableOpacity } from "react-native";
import { ExploreMapView } from "../../src/features/explore/components/ExploreMapView.nativeMap";
import { EXPLORE_COPY } from "../../src/features/explore/content/explore.strings";

const button = (root: TestRenderer.ReactTestInstance, label: string) =>
  root.findAll(
    (node) =>
      node.type === TouchableOpacity && node.props.accessibilityLabel === label
  );

test("expanded map shows a minimize chip under the target that closes it", async () => {
  let renderer!: TestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = TestRenderer.create(<ExploreMapView center={[1, 2]} />);
  });
  const root = renderer.root;
  expect(button(root, EXPLORE_COPY.minimizeMap)).toHaveLength(0);

  await act(async () => button(root, EXPLORE_COPY.expand)[0].props.onPress());
  expect(root.findByType(Modal).props.visible).toBe(true);

  // Target first, minimize directly below it in the same control column.
  const target = button(root, EXPLORE_COPY.recenter)[0];
  const labels = target
    .parent!.children.filter(
      (child): child is TestRenderer.ReactTestInstance =>
        typeof child !== "string" && child.type === TouchableOpacity
    )
    .map((child) => child.props.accessibilityLabel);
  expect(labels).toEqual([EXPLORE_COPY.recenter, EXPLORE_COPY.minimizeMap]);

  await act(async () =>
    button(root, EXPLORE_COPY.minimizeMap)[0].props.onPress()
  );
  expect(root.findByType(Modal).props.visible).toBe(false);
  expect(button(root, EXPLORE_COPY.expand)).toHaveLength(1);
  // The map load watchdog timer is cleared on unmount.
  await act(async () => renderer.unmount());
});

test("cluster selection streams unique BirdLife IDs without replacing source geography", async () => {
  const features = ["one", "two"].map((id) => ({
    type: "Feature",
    id,
    geometry: { type: "Point", coordinates: [1, 2] },
    properties: { id, birdsLifeId: "123" },
  }));
  const geoJSON = { type: "FeatureCollection", features } as never;
  const selected = jest.fn();
  let renderer!: TestRenderer.ReactTestRenderer;
  mockNativeLeaves.mockResolvedValue({ type: "FeatureCollection", features });
  await act(async () => {
    renderer = TestRenderer.create(
      <ExploreMapView
        center={[1, 2]}
        geoJSON={geoJSON}
        onSelectionChange={selected}
      />
    );
  });
  const source = () =>
    renderer.root
      .findAllByType(ShapeSource)
      .find((node) => node.props.id === "explore-sightings")!;
  await act(async () =>
    source().props.onPress({
      features: [
        {
          type: "Feature",
          geometry: { type: "Point", coordinates: [1, 2] },
          properties: { point_count: 2 },
        },
      ],
    })
  );
  expect(selected).toHaveBeenLastCalledWith(["123"]);
  expect(source().props.shape).toBe(geoJSON);
  await act(async () => renderer.unmount());
});
