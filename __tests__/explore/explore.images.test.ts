import FastImage from "react-native-fast-image";
import { Image } from "react-native";
jest.mock("react-native-fast-image", () => ({
  __esModule: true,
  default: {
    preload: jest.fn(),
    priority: { low: "low" },
    cacheControl: { immutable: "immutable" },
  },
}));
import {
  forgetExplorePhoto,
  prefetchExplorePhotos,
} from "../../src/features/explore/services/exploreImages";
test("Explore warms only its visible FastImage buffer and retries expired/failed hints", () => {
  jest.useFakeTimers();
  const native = jest.spyOn(Image, "prefetch");
  const preload = jest.mocked(FastImage.preload);
  const urls = Array.from(
    { length: 20 },
    (_, i) => `https://example.com/bird-${i}.jpg`
  );
  prefetchExplorePhotos(urls, 3);
  expect(preload).toHaveBeenCalledTimes(1);
  expect(preload.mock.calls[0][0]).toHaveLength(3);
  expect(preload.mock.calls[0][0][0]).toMatchObject({ priority: "low" });
  expect(native).not.toHaveBeenCalled();
  prefetchExplorePhotos(urls, 3);
  expect(preload).toHaveBeenCalledTimes(1);
  forgetExplorePhoto(urls[0]);
  prefetchExplorePhotos(urls, 1);
  expect(preload).toHaveBeenCalledTimes(2);
  jest.advanceTimersByTime(180001);
  prefetchExplorePhotos(urls, 3);
  expect(preload).toHaveBeenCalledTimes(3);
  native.mockRestore();
  jest.useRealTimers();
});
