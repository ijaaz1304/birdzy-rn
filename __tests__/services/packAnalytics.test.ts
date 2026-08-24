import {
  getBirdzyPackAnalyticsEvent,
} from "../../src/services/analytics/packAnalytics";
import { EVENTS } from "../../src/services/analytics/analytics.events";

jest.mock("../../src/services/analytics/analytics.service", () => ({
  analyticsService: { logEvent: jest.fn() },
}));

describe("getBirdzyPackAnalyticsEvent", () => {
  it("maps yearly product ids from either store naming", () => {
    expect(getBirdzyPackAnalyticsEvent("yearly_birdzy_pack")).toBe(
      EVENTS.yearly_pack_birdzy
    );
    expect(getBirdzyPackAnalyticsEvent("yearly_pack_birdzy")).toBe(
      EVENTS.yearly_pack_birdzy
    );
  });

  it("maps weekly product ids", () => {
    expect(getBirdzyPackAnalyticsEvent("weekly_birdzy_pack")).toBe(
      EVENTS.weekly_pack_birdzy
    );
    expect(getBirdzyPackAnalyticsEvent("weekly_pack_birdzy")).toBe(
      EVENTS.weekly_pack_birdzy
    );
  });

  it("maps lifetime before yearly (life matches first)", () => {
    expect(getBirdzyPackAnalyticsEvent("lifetime_birdzy")).toBe(
      EVENTS.lifetime_pack_birdzy
    );
    expect(getBirdzyPackAnalyticsEvent("lifetime_pack_birdzy")).toBe(
      EVENTS.lifetime_pack_birdzy
    );
  });

  it("returns null for unknown ids", () => {
    expect(getBirdzyPackAnalyticsEvent("unknown_sku")).toBeNull();
  });
});
