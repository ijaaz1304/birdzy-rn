import {
  isAppearanceOptionVisibleForBuild,
  isAppearanceOptionVisibleForThemeDefault,
  isThemeLockedToLightForBuild,
  isThemeLockedToLightForThemeDefault,
  normalizeThemeDefaultRc,
} from "../../src/features/theme/themeExperiment";
import { isDarkModeLocalRolloutEnabled } from "../../src/constants/featureFlags";

jest.mock("../../src/constants/featureFlags", () => ({
  isDarkModeLocalRolloutEnabled: jest.fn(() => false),
}));

const mockedLocalRollout = isDarkModeLocalRolloutEnabled as jest.Mock;

describe("themeExperiment", () => {
  beforeEach(() => {
    mockedLocalRollout.mockReturnValue(false);
  });

  it("maps RC arms to system vs light", () => {
    expect(normalizeThemeDefaultRc("system")).toBe("system");
    expect(normalizeThemeDefaultRc("variant_a")).toBe("system");
    expect(normalizeThemeDefaultRc("light")).toBe("light");
    expect(normalizeThemeDefaultRc("variant_b")).toBe("light");
  });

  it("hides appearance for light arm in prod", () => {
    expect(isAppearanceOptionVisibleForThemeDefault("light")).toBe(false);
    expect(isThemeLockedToLightForThemeDefault("light")).toBe(true);
  });

  it("dev APK always shows appearance and never locks theme", () => {
    mockedLocalRollout.mockReturnValue(true);
    expect(isAppearanceOptionVisibleForBuild("light", true)).toBe(true);
    expect(isThemeLockedToLightForBuild("light", true)).toBe(false);
  });
});
