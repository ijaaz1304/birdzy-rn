import {
  getDeepLinkPathSegment,
  isDeepLinkUrl,
  parseDeepLinkUrl,
} from "./parseDeepLinkUrl";
import { isDevIntent } from "../../lib/env/appEnv";

jest.mock("../../lib/env/appEnv", () => ({
  isDevIntent: jest.fn(() => false),
}));

const mockIsDevIntent = isDevIntent as jest.MockedFunction<typeof isDevIntent>;

describe("parseDeepLinkUrl", () => {
  beforeEach(() => {
    mockIsDevIntent.mockReturnValue(false);
  });

  it("recognizes prod HTTPS and custom scheme URLs", () => {
    expect(
      isDeepLinkUrl("https://birdzy-app.web.app/collection")
    ).toBe(true);
    expect(isDeepLinkUrl("birdzy://feed")).toBe(true);
    expect(isDeepLinkUrl("https://example.com/home")).toBe(false);
  });

  it("rejects dev scheme on prod build", () => {
    expect(isDeepLinkUrl("birdzy-dev://feed")).toBe(false);
    expect(parseDeepLinkUrl("birdzy-dev://feed")).toBeNull();
  });

  it("rejects prod host on dev build", () => {
    mockIsDevIntent.mockReturnValue(true);
    expect(
      isDeepLinkUrl("https://birdzy-app.web.app/collection")
    ).toBe(false);
  });

  it("accepts dev scheme and host on dev build", () => {
    mockIsDevIntent.mockReturnValue(true);
    expect(isDeepLinkUrl("birdzy-dev://feed")).toBe(true);
    expect(
      isDeepLinkUrl("https://birdzy-app-dev.web.app/collection")
    ).toBe(true);
    const target = parseDeepLinkUrl(
      "https://birdzy-app-dev.web.app/collection"
    );
    expect(target?.screen).toBe("MainTabs");
  });

  it("ignores password-reset auth links", () => {
    expect(
      isDeepLinkUrl(
        "birdzy://reset-password?email=user@example.com&code=123456"
      )
    ).toBe(false);
  });

  it("extracts the first path segment", () => {
    expect(
      getDeepLinkPathSegment(
        "https://birdzy-app.web.app/collection?utm=1"
      )
    ).toBe("collection");
    expect(getDeepLinkPathSegment("birdzy://identify")).toBe("identify");
  });

  it("maps collection to MainTabs Collection", () => {
    const target = parseDeepLinkUrl(
      "https://birdzy-app.web.app/collection"
    );
    expect(target?.screen).toBe("MainTabs");
    expect(target?.params).toMatchObject({
      screen: "Collection",
      params: { screen: "CollectionMain" },
    });
  });

  it("maps subs to SubscriptionStack paywall", () => {
    const target = parseDeepLinkUrl("birdzy://subs");
    expect(target?.screen).toBe("SubscriptionStack");
    expect(target?.params).toMatchObject({
      screen: "SubscriptionMain",
      params: { comingFrom: "deepLink" },
    });
  });

  it("maps quiz to Find Your Bird", () => {
    const target = parseDeepLinkUrl("birdzy://quiz");
    expect(target?.screen).toBe("BirdPersonalityStack");
    expect(target?.params).toMatchObject({
      screen: "BirdPersonalityIntro",
    });
  });

  it("maps settings, ask-ai, and subs to overlay stacks", () => {
    expect(parseDeepLinkUrl("birdzy://settings")?.screen).toBe(
      "SettingsStack"
    );
    expect(parseDeepLinkUrl("birdzy://ask-ai")?.screen).toBe("AskAIStack");
    expect(parseDeepLinkUrl("birdzy://subscription")?.screen).toBe(
      "SubscriptionStack"
    );
  });

  it("returns null for unknown paths (no navigation)", () => {
    expect(parseDeepLinkUrl("birdzy://invalid-path")).toBeNull();
  });

  it("maps empty custom scheme path to home", () => {
    const target = parseDeepLinkUrl("birdzy://");
    expect(target?.screen).toBe("MainTabs");
    expect(target?.params).toMatchObject({
      screen: "Home",
    });
  });

  it("maps bare hosting URL to home", () => {
    const target = parseDeepLinkUrl("https://birdzy-app.web.app/");
    expect(target?.screen).toBe("MainTabs");
    expect(target?.params).toMatchObject({
      screen: "Home",
    });
  });

  it("maps home path explicitly", () => {
    const target = parseDeepLinkUrl("birdzy://home");
    expect(target?.screen).toBe("MainTabs");
  });
});
