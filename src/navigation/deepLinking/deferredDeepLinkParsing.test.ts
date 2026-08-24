import {
  buildHttpsUrlFromDeferredPath,
  extractDeferredPathFromReferrer,
} from "./deferredDeepLinkParsing";
import { DEFERRED_DEEP_LINK_REFERRER_PARAM } from "./deepLink.constants";

describe("deferredDeepLinkParsing", () => {
  it("extracts birdzy_dl path from install referrer", () => {
    expect(
      extractDeferredPathFromReferrer(
        `${DEFERRED_DEEP_LINK_REFERRER_PARAM}=feed%2Fpost%2Fabc123`
      )
    ).toBe("feed/post/abc123");
  });

  it("extracts birdzy_dl from nested referrer query", () => {
    expect(
      extractDeferredPathFromReferrer(
        `utm_source=web&${DEFERRED_DEEP_LINK_REFERRER_PARAM}=collection`
      )
    ).toBe("collection");
  });

  it("builds prod HTTPS URL from deferred path", () => {
    expect(buildHttpsUrlFromDeferredPath("collection")).toBe(
      "https://birdzy-app.web.app/collection"
    );
  });

  it("defaults empty path to home", () => {
    expect(buildHttpsUrlFromDeferredPath("")).toBe(
      "https://birdzy-app.web.app/home"
    );
  });
});
