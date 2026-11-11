import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { TouchableOpacity } from "react-native";

jest.mock("@/components/AppImage", () => ({ AppImage: "AppImage" }));
jest.mock("react-native-vector-icons/MaterialIcons", () => "MaterialIcons");
jest.mock("react-native-svg", () => ({
  __esModule: true,
  default: "MapSvg",
  Polyline: "MapOutline",
}));
jest.mock("../../src/components/shared", () => ({ AppText: "AppText" }));
jest.mock("../../src/features/explore/assets", () => ({
  HomeExploreHotspotIcon: () => null,
  HomeExplorePinIcon: () => null,
  exploreImages: { homeMap: 1 },
}));
jest.mock("../../src/hooks/useTheme", () => ({
  useIsDark: () => false,
  useTheme: () => ({
    colors: {
      surfacePrimary: "#fff",
      surfaceSecondary: "#111",
      textPrimary: "#000",
      border0: "#ccc",
    },
  }),
}));
import { HomeExploreNearYouSection } from "../../src/features/explore/components/HomeExploreNearYouSection";

let tree: TestRenderer.ReactTestRenderer;
const handlers = () => ({
  onExploreMap: jest.fn(),
  onGrowingNow: jest.fn(),
  onYearRound: jest.fn(),
});
const render = async (
  props: Partial<React.ComponentProps<typeof HomeExploreNearYouSection>> = {}
) => {
  const h = handlers();
  await act(async () => {
    tree = TestRenderer.create(
      <HomeExploreNearYouSection {...h} {...props} />
    );
  });
  return h;
};
const labelled = (label: string) =>
  tree.root.findAll(
    (node) =>
      node.type === TouchableOpacity && node.props.accessibilityLabel === label
  );
afterEach(async () => {
  if (tree) await act(async () => tree.unmount());
});

test("the whole banner is tappable and shows Explore Map when location is on", async () => {
  const h = await render({ locationGranted: true });
  expect(labelled("Explore Map")).toHaveLength(1);
  await act(async () => {
    labelled("Explore Map")[0].props.onPress();
  });
  expect(h.onExploreMap).toHaveBeenCalled();
});

test("shows Enable Location when location access is off", async () => {
  await render({ locationGranted: false });
  expect(labelled("Enable Location")).toHaveLength(1);
  expect(labelled("Explore Map")).toHaveLength(0);
});

test("hides Spotted Now and Year-round rows in catalogue standalone mode", async () => {
  await render({ showRows: false });
  const labels = tree.root
    .findAllByType("AppText" as never)
    .map((node) => String(node.props.children));
  expect(labels).not.toContain("Spotted Now");
  expect(labels).not.toContain("Year-round");
});
