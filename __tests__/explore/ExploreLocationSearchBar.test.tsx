import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { TextInput } from "react-native";
const mockCancel = jest.fn();
jest.mock("react-native-vector-icons/MaterialIcons", () => "MaterialIcons");
jest.mock("../../src/atoms", () => ({ Text: "Text" }));
jest.mock("../../src/hooks/useTheme", () => ({
  useTheme: () => ({ colors: {} }),
  useIsDark: () => false,
}));
jest.mock("../../src/design", () => ({ Radius: { full: 999, md: 8 } }));
jest.mock("../../src/design-system/spacing", () => ({ spacing: { 4: 16 } }));
jest.mock("../../src/features/explore/assets", () => ({
  ExploreLocationSearchIcon: "Search",
  ExploreLocationSearchIconDark: "SearchDark",
  ExploreSearchTargetIcon: "Target",
  ExploreSearchTargetIconDark: "TargetDark",
}));
jest.mock("../../src/features/explore/hooks/useLocationSuggestions", () => ({
  useLocationSuggestions: jest.fn(() => ({
    suggestions: [],
    isLoading: false,
    error: null,
    cancel: mockCancel,
  })),
}));
import { useLocationSuggestions } from "../../src/features/explore/hooks/useLocationSuggestions";
import { ExploreLocationSearchBar } from "../../src/features/explore/components/ExploreLocationSearchBar";
let tree: TestRenderer.ReactTestRenderer;
beforeEach(() => jest.useFakeTimers());
afterEach(async () => {
  await act(async () => tree?.unmount());
  jest.useRealTimers();
});
test("a late place label cannot replace the search currently being typed", async () => {
  const field = (label: string) => (
    <ExploreLocationSearchBar
      locationLabel={label}
      onSelectLocation={jest.fn()}
    />
  );
  await act(async () => {
    tree = TestRenderer.create(field("Current Location"));
  });
  const input = () => tree.root.findByType(TextInput);
  await act(async () => input().props.onFocus());
  await act(async () => input().props.onChangeText("London"));
  await act(async () => tree.update(field("Bengaluru")));
  expect(input().props.value).toBe("London");
});
test("only the visible input reads suggestions and expansion preserves the shared draft", async () => {
  function Pair({ expanded }: { expanded: boolean }) {
    const [value, setValue] = React.useState("");
    const draft = { value, setValue };
    return (
      <>
        <ExploreLocationSearchBar
          active={!expanded}
          draft={draft}
          locationLabel="London"
          onSelectLocation={jest.fn()}
        />
        {expanded && (
          <ExploreLocationSearchBar
            active
            draft={draft}
            locationLabel="London"
            onSelectLocation={jest.fn()}
          />
        )}
      </>
    );
  }
  await act(async () => {
    tree = TestRenderer.create(<Pair expanded={false} />);
  });
  const input = () => tree.root.findByType(TextInput);
  await act(async () => input().props.onFocus());
  await act(async () => input().props.onChangeText("Bengaluru"));
  expect(jest.mocked(useLocationSuggestions)).toHaveBeenLastCalledWith(
    "Bengaluru",
    true
  );
  await act(async () => {
    input().props.onBlur();
    tree.update(<Pair expanded />);
  });
  await act(async () => {
    await jest.advanceTimersByTimeAsync(200);
  });
  const fields = tree.root.findAllByType(TextInput);
  expect(fields.map((field) => field.props.value)).toEqual([
    "Bengaluru",
    "Bengaluru",
  ]);
  await act(async () => fields[1].props.onFocus());
  expect(jest.mocked(useLocationSuggestions)).toHaveBeenLastCalledWith(
    "Bengaluru",
    true
  );
});
