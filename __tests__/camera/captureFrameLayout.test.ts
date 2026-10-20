import { computeCaptureFrameLayout } from "../../src/features/camera/captureFrameLayout";
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0 }),
}));
it.each([
  [375, 667, 20],
  [390, 844, 47],
  [320, 568, 20],
])(
  "keeps the frame clear of the measured banner and two-photo controls at %s x %s",
  (width, height, top) => {
    const minimumTop = top + 68 + 100 + 16;
    const bottomInset = 300;
    const layout = computeCaptureFrameLayout(width, height, top, {
      minimumTop,
      bottomInset,
    });
    expect(layout.frameTop).toBeGreaterThanOrEqual(minimumTop);
    expect(layout.frameTop + layout.frameSize).toBeLessThanOrEqual(
      height - bottomInset
    );
    expect(layout.frameSize).toBeGreaterThan(0);
    expect(layout.frameSize).toBeLessThanOrEqual(width - 40);
  }
);
