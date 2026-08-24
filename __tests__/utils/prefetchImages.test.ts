import FastImage from "react-native-fast-image";
import { Image } from "react-native";
import {
  awaitPrefetchRemoteImages,
  isRemoteImageCacheReady,
  markRemoteImageCacheReady,
  prefetchRemoteImage,
  prefetchRemoteImages,
} from "../../src/utils/prefetchImages";

jest.mock("react-native-fast-image", () => ({
  __esModule: true,
  default: {
    preload: jest.fn(),
    priority: { high: "high", normal: "normal", low: "low" },
    cacheControl: { immutable: "immutable" },
  },
}));

const preload = FastImage.preload as jest.Mock;

describe("prefetchImages ready-flag contract", () => {
  beforeEach(() => {
    preload.mockClear();
    jest.spyOn(Image, "prefetch").mockResolvedValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("does not mark a URI ready when FastImage.preload is only kicked off", async () => {
    const uri = `https://cdn.example.com/prefetch-${Date.now()}.jpg`;
    await prefetchRemoteImage(uri);
    expect(preload).toHaveBeenCalled();
    expect(isRemoteImageCacheReady(uri)).toBe(false);
  });

  it("does not mark batch URIs ready after prefetchRemoteImages", () => {
    const uri = `https://cdn.example.com/batch-${Date.now()}.jpg`;
    prefetchRemoteImages([uri], 10);
    expect(isRemoteImageCacheReady(uri)).toBe(false);
  });

  it("does not mark URIs ready after awaitPrefetchRemoteImages", async () => {
    const uri = `https://cdn.example.com/await-${Date.now()}.jpg`;
    await awaitPrefetchRemoteImages([uri], 5, 8000);
    expect(isRemoteImageCacheReady(uri)).toBe(false);
  });

  it("marks a URI ready only after explicit onLoad", async () => {
    const uri = `https://cdn.example.com/onload-${Date.now()}.jpg`;
    await prefetchRemoteImage(uri);
    expect(isRemoteImageCacheReady(uri)).toBe(false);
    markRemoteImageCacheReady(uri);
    expect(isRemoteImageCacheReady(uri)).toBe(true);
  });
});
