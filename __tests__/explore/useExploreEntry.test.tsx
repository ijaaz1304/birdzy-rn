import React from "react";
import TestRenderer, { act } from "react-test-renderer";

const mockNavigate = jest.fn();
const mockFlow = {
  showEnablePopup: false,
  setShowEnablePopup: jest.fn(),
  showManagePopup: false,
  setShowManagePopup: jest.fn(),
  showAddLocationSheet: false,
  setShowAddLocationSheet: jest.fn(),
  loading: false,
  requestExploreAccess: jest.fn(),
  handleAllowLocation: jest.fn(),
  openAddLocation: jest.fn(),
};
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));
jest.mock("../../src/features/explore/useExploreLocationToggleFlow", () => ({
  useExploreLocationToggleFlow: () => mockFlow,
}));
jest.mock("../../src/molecules/Modal/LocationPermissionPopup", () => ({
  LocationPermissionPopup: "EnablePopup",
}));
jest.mock("../../src/molecules/Modal/LocationManageAccessPopup", () => ({
  LocationManageAccessPopup: "ManagePopup",
}));
jest.mock("../../src/molecules/Modal/ChangeLocationBottomSheet", () => ({
  ChangeLocationBottomSheet: "AddSheet",
}));
import {
  useExploreEntry,
  type ExploreEntryTab,
} from "../../src/features/explore/useExploreEntry";

let tree: TestRenderer.ReactTestRenderer;
let entry: ReturnType<typeof useExploreEntry>;
const Probe = () => {
  entry = useExploreEntry();
  return <>{entry.popups}</>;
};
const popup = (type: string) => tree.root.findByType(type as never).props;
beforeEach(async () => {
  jest.clearAllMocks();
  await act(async () => {
    tree = TestRenderer.create(<Probe />);
  });
});
afterEach(async () => {
  await act(async () => tree.unmount());
});

test("with location access already in place Explore opens straight away on the requested tab", async () => {
  mockFlow.requestExploreAccess.mockResolvedValue("granted");
  await act(async () => entry.openExplore("yearRound" as ExploreEntryTab));
  expect(mockNavigate).toHaveBeenCalledWith("ExploreStack", {
    screen: "ExploreMap",
    params: { initialTab: "yearRound" },
  });
});

test("it opens on Spotted Now (growingNow) when no tab is given", async () => {
  mockFlow.requestExploreAccess.mockResolvedValue("granted");
  await act(async () => entry.openExplore());
  expect(mockNavigate.mock.calls[0][1].params.initialTab).toBe("growingNow");
});

test("without access it does not navigate; a popup is left to ask", async () => {
  mockFlow.requestExploreAccess.mockResolvedValue("pending");
  await act(async () => entry.openExplore("growingNow"));
  expect(mockNavigate).not.toHaveBeenCalled();
});

test("allowing location in the popup opens Explore on the tab that was tapped", async () => {
  mockFlow.requestExploreAccess.mockResolvedValue("pending");
  mockFlow.handleAllowLocation.mockResolvedValue(true);
  await act(async () => entry.openExplore("yearRound"));
  await act(async () => popup("EnablePopup").onAllowLocation());
  expect(mockNavigate).toHaveBeenCalledWith("ExploreStack", {
    screen: "ExploreMap",
    params: { initialTab: "yearRound" },
  });
});

test("choosing a custom location opens Explore with that place", async () => {
  await act(async () =>
    popup("AddSheet").onConfirm({
      latitude: 12.9,
      longitude: 77.6,
      address: "Bengaluru",
    })
  );
  expect(mockNavigate).toHaveBeenCalledWith("ExploreStack", {
    screen: "ExploreMap",
    params: {
      initialTab: "growingNow",
      initialLocation: { lat: 12.9, lng: 77.6, label: "Bengaluru" },
    },
  });
});
