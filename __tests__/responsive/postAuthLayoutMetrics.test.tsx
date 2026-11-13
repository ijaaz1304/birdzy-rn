import React from "react";
import { act, create } from "react-test-renderer";

let mockWindow = { width: 411, height: 923, fontScale: 1, scale: 3 };
jest.mock("react-native/Libraries/Utilities/useWindowDimensions", () => ({
  __esModule: true,
  default: () => mockWindow,
}));
jest.mock("../../src/utils/tabletLayout", () => ({ isTabletDevice: () => false }));

import { usePostAuthLayoutMetrics } from "../../src/features/post-auth-onboarding/utils/postAuthLayout";

const iconFor = async (fontScale: number) => {
  mockWindow = { width: 411, height: 923, fontScale, scale: 3 };
  let size = 0;
  const Probe = () => {
    size = usePostAuthLayoutMetrics().subscriptionCarouselIconSize;
    return null;
  };
  await act(async () => {
    create(<Probe />);
  });
  return size;
};

test("paywall carousel illustration: larger at default text, smallest of its range at larger text", async () => {
  expect(await iconFor(1)).toBeGreaterThan(64);
  expect(await iconFor(1.3)).toBe(64);
  expect(await iconFor(2)).toBe(64);
});
