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

  it("still classifies the light Remote Config arm", () => {
    expect(isAppearanceOptionVisibleForThemeDefault("light")).toBe(false);
    expect(isThemeLockedToLightForThemeDefault("light")).toBe(true);
  });

  it("shows Appearance and does not lock the theme when dark mode is on", () => {
    mockedLocalRollout.mockReturnValue(false);
    expect(isAppearanceOptionVisibleForBuild("light", true)).toBe(true);
    expect(isAppearanceOptionVisibleForBuild("system", true)).toBe(true);
    expect(isThemeLockedToLightForBuild("light", true)).toBe(false);
    expect(isAppearanceOptionVisibleForBuild("system", false)).toBe(false);
    expect(isThemeLockedToLightForBuild("system", false)).toBe(true);
  });
});
