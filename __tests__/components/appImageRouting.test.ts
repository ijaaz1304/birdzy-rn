/**
 * AppImage routing — unit tests + asset registry audit + routing perf smoke.
 */
import fs from "fs";
import path from "path";

jest.mock("react-native", () => ({
  Platform: { OS: "ios" },
  Image: {
    resolveAssetSource: jest.fn((id: number) => mockAssetUriById.get(id)),
  },
}));

const mockAssetUriById = new Map<number, { uri: string }>();
let nextAssetId = 1;

function registerMockAsset(relativePath: string): number {
  const id = nextAssetId++;
  mockAssetUriById.set(id, {
    uri: `https://localhost/assets/${relativePath}`,
  });
  return id;
}

import {
  getExpectedRendererForBundledPath,
  getExpectedRendererForRemoteUrl,
  isBundledWebpAsset,
  isRemoteImageSource,
  resolveAppImageBackgroundRenderer,
  resolveAppImageRenderer,
  shouldUseFastImage,
} from "../../src/components/AppImage/appImageRouting";

function parseAssetsFromIndex(): Array<{ key: string; rel: string; ext: string }> {
  const indexPath = path.join(__dirname, "../../src/assets/index.ts");
  const content = fs.readFileSync(indexPath, "utf8");
  return [...content.matchAll(/(\w+): require\("\.\/([^"]+)"\)/g)].map(
    ([, key, rel]) => ({
      key,
      rel,
      ext: path.extname(rel).slice(1).toLowerCase(),
    })
  );
}

describe("AppImage routing", () => {
  beforeEach(() => {
    mockAssetUriById.clear();
    nextAssetId = 1;
  });

  describe("bundled assets on iOS", () => {
    it("routes bundled WebP to RN Image (first-frame paint)", () => {
      const id = registerMockAsset("icons/mushroom/trash.webp");
      expect(isBundledWebpAsset(id)).toBe(true);
      expect(resolveAppImageRenderer(id, "ios")).toBe("rn-image");
      expect(shouldUseFastImage(id, "ios")).toBe(false);
    });

    it("routes bundled PNG to RN Image (first-frame paint)", () => {
      const id = registerMockAsset("iconfix/close_popup.png");
      expect(isBundledWebpAsset(id)).toBe(false);
      expect(resolveAppImageRenderer(id, "ios")).toBe("rn-image");
      expect(shouldUseFastImage(id, "ios")).toBe(false);
    });

    it("routes bundled JPEG to RN Image", () => {
      const id = registerMockAsset("banner/photo.jpg");
      expect(resolveAppImageRenderer(id, "ios")).toBe("rn-image");
    });

    it("routes tinted bundled assets to RN Image (tintColor parity)", () => {
      const id = registerMockAsset("icons/mushroom/eye.webp");
      expect(resolveAppImageRenderer(id, "ios")).toBe("rn-image");
      expect(
        resolveAppImageRenderer(id, "ios", { requiresTintColor: true })
      ).toBe("rn-image");
      expect(
        shouldUseFastImage(id, "ios", { requiresTintColor: true })
      ).toBe(false);
    });

    it("routes tinted bundled assets to RN Image on Android", () => {
      const id = registerMockAsset("camera/light/upload.webp");
      expect(
        resolveAppImageRenderer(id, "android", { requiresTintColor: true })
      ).toBe("rn-image");
    });

    it("routes preferRNImage bundled assets to RN Image", () => {
      const id = registerMockAsset("iconfix/upload.png");
      expect(
        resolveAppImageRenderer(id, "ios", { preferRNImage: true })
      ).toBe("rn-image");
      expect(
        shouldUseFastImage(id, "android", { preferRNImage: true })
      ).toBe(false);
    });
  });

  describe("bundled assets on Android", () => {
    it("routes all bundled assets to RN Image including WebP", () => {
      const webpId = registerMockAsset("home/identify.webp");
      const pngId = registerMockAsset("bottomTab/home.png");
      expect(resolveAppImageRenderer(webpId, "android")).toBe("rn-image");
      expect(resolveAppImageRenderer(pngId, "android")).toBe("rn-image");
    });
  });

  describe("remote URLs", () => {
    it("routes https WebP to FastImage on iOS", () => {
      const source = { uri: "https://cdn.example.com/img.webp" };
      expect(isRemoteImageSource(source)).toBe(true);
      expect(getExpectedRendererForRemoteUrl(source.uri)).toBe("fast-image");
      expect(resolveAppImageRenderer(source, "ios")).toBe("fast-image");
    });

    it("routes https PNG to FastImage (cache path, not RN Image)", () => {
      const source = { uri: "https://cdn.example.com/img.png" };
      expect(resolveAppImageRenderer(source, "ios")).toBe("fast-image");
      expect(resolveAppImageRenderer(source, "android")).toBe("fast-image");
    });

    it("routes http(s) remote URLs to FastImage; local URIs to RN Image", () => {
      const remoteUris = ["https://a.com/x.webp", "https://a.com/x.png"];
      for (const uri of remoteUris) {
        expect(resolveAppImageRenderer({ uri }, "ios")).toBe("fast-image");
        expect(resolveAppImageRenderer({ uri }, "android")).toBe("fast-image");
      }
      const localUris = [
        "file:///tmp/photo.jpg",
        "content://media/external/images/1",
        "ph://ASSET-ID",
      ];
      for (const uri of localUris) {
        expect(resolveAppImageRenderer({ uri }, "ios")).toBe("rn-image");
        expect(resolveAppImageRenderer({ uri }, "android")).toBe("rn-image");
      }
    });
  });

  describe("AppImageBackground parity", () => {
    it("uses the same resolver as AppImage", () => {
      expect(resolveAppImageBackgroundRenderer).toBe(resolveAppImageRenderer);
      const webp = registerMockAsset("popUp/mushroom/light/rate_us.webp");
      const png = registerMockAsset("iconfix/close_sheet.png");
      expect(resolveAppImageBackgroundRenderer(webp, "ios")).toBe("rn-image");
      expect(resolveAppImageBackgroundRenderer(png, "ios")).toBe("rn-image");
    });
  });

  describe("full assets registry (static paths)", () => {
    const assets = parseAssetsFromIndex();

    it.each(assets)(
      "bundled asset $key → RN Image on iOS and Android",
      ({ rel }) => {
        expect(getExpectedRendererForBundledPath("ios", rel)).toBe("rn-image");
        expect(getExpectedRendererForBundledPath("android", rel)).toBe(
          "rn-image"
        );
      }
    );

    it("registry has WebP and PNG entries", () => {
      const webpCount = assets.filter((a) => a.ext === "webp").length;
      const pngCount = assets.filter((a) => a.ext === "png").length;
      expect(webpCount).toBeGreaterThan(50);
      expect(pngCount).toBeGreaterThan(50);
    });
  });

  describe("routing perf smoke", () => {
    it("resolveAppImageRenderer stays fast under repeated calls", () => {
      const webp = registerMockAsset("identification/light/too_dark.webp");
      const png = registerMockAsset("navigation/go_back.png");
      const remote = { uri: "https://cdn.example.com/x.webp" };

      const start = Date.now();
      for (let i = 0; i < 20_000; i++) {
        resolveAppImageRenderer(webp, "ios");
        resolveAppImageRenderer(png, "ios");
        resolveAppImageRenderer(remote, "android");
      }
      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(200);
    });
  });
});
