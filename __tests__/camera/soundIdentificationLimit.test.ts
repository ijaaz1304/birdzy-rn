import { getCarouselItemForLimitType } from "../../src/config/subscription.config";

describe("sound identification limit sheet", () => {
  it("uses dedicated carousel copy for soundIdentification limit type", () => {
    const item = getCarouselItemForLimitType("soundIdentification");
    expect(item.iconKey).toBe("soundIdentification");
    expect(item.description).toMatch(/account.*free scan allowance/i);
  });

  it("uses combined photo+sound copy for generic identification limit type", () => {
    const item = getCarouselItemForLimitType("identification");
    expect(item.iconKey).toBe("identification");
    expect(item.description).toMatch(/account.*free scan allowance/i);
  });
});
