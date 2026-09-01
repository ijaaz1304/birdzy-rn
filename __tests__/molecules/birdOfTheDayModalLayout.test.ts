jest.mock("@/utils/tabletLayout", () => ({
  isTabletDevice: (width: number) => width >= 600,
}));

import { computeBirdOfTheDayModalLayout } from "../../src/molecules/Modal/birdOfTheDayModal.config";

describe("computeBirdOfTheDayModalLayout", () => {
  it("caps content width on iPad and keeps footer above safe area", () => {
    const layout = computeBirdOfTheDayModalLayout({
      windowWidth: 820,
      windowHeight: 1180,
      safeTop: 24,
      safeBottom: 20,
      hasScientificName: true,
      hasPrice: false,
      showRefresh: false,
    });

    expect(layout.contentWidth).toBeLessThanOrEqual(390);
    expect(layout.contentLeft).toBeGreaterThan(0);
    expect(layout.footerBottom).toBeGreaterThanOrEqual(20);
    expect(layout.heroLayerTop).toBeGreaterThan(0);
    expect(layout.heroWidth).toBeGreaterThan(0);
    expect(layout.headerHeight).toBeLessThan(180);
  });

  it("keeps hero between header and footer on phone", () => {
    const layout = computeBirdOfTheDayModalLayout({
      windowWidth: 390,
      windowHeight: 844,
      safeTop: 47,
      safeBottom: 34,
      hasScientificName: true,
      hasPrice: true,
      showRefresh: true,
      measuredFooterHeight: 120,
    });

    const headerBottom = layout.contentPaddingTop + layout.headerHeight;
    const footerTop =
      844 - layout.footerBottom - 120;
    expect(layout.heroLayerTop).toBeGreaterThanOrEqual(headerBottom);
    expect(layout.heroLayerTop + layout.heroHeight).toBeLessThanOrEqual(
      footerTop
    );
    expect(layout.headerHeight).toBeLessThan(170);
    expect(layout.headerWidth).toBeLessThanOrEqual(300);
  });
});
