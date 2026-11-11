import React from "react";
import TestRenderer, { act } from "react-test-renderer";

jest.mock("../../src/molecules", () => ({
  EmptyState: "EmptyState",
}));
jest.mock("../../src/features/explore/assets", () => ({
  ExploreNoResultsIcon: "ExploreNoResultsIcon",
}));
import { ExploreEmptyState } from "../../src/features/explore/components/ExploreEmptyState";

test("default empty state uses the bird activity wording and body appearance", async () => {
  let tree!: TestRenderer.ReactTestRenderer;
  await act(async () => {
    tree = TestRenderer.create(<ExploreEmptyState />);
  });
  const empty = tree.root.findByType("EmptyState" as never);
  expect(empty.props.appearance).toBe("body");
  expect(empty.props.title).toBe("No birds found in this area.");
  expect(empty.props.subtitle).toContain("bird activity in the current map area");
});

test("filtered empty state points at the filters", async () => {
  let tree!: TestRenderer.ReactTestRenderer;
  await act(async () => {
    tree = TestRenderer.create(<ExploreEmptyState filtered />);
  });
  expect(tree.root.findByType("EmptyState" as never).props.subtitle).toContain(
    "filters"
  );
});

test("wide empty state asks the user to zoom in", async () => {
  let tree!: TestRenderer.ReactTestRenderer;
  await act(async () => {
    tree = TestRenderer.create(<ExploreEmptyState wide />);
  });
  expect(tree.root.findByType("EmptyState" as never).props.title).toBe(
    "Zoom in to see birds."
  );
});
