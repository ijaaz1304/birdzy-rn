const mockIsAppearanceSettingsEnabled = jest.fn(() => true);

jest.mock("../../constants/featureFlags", () => ({
  isDarkModeEnabledForApp: jest.fn(() => true),
}));

jest.mock("./themeExperiment.service", () => ({
  isAppearanceSettingsEnabled: () => mockIsAppearanceSettingsEnabled(),
}));

import { isDarkModeFeatureEnabled } from "./darkModeFeature";

describe("isDarkModeFeatureEnabled", () => {
  beforeEach(() => {
    mockIsAppearanceSettingsEnabled.mockReset();
  });

  it("returns true for Variant A (Appearance picker visible)", () => {
    mockIsAppearanceSettingsEnabled.mockReturnValue(true);
    expect(isDarkModeFeatureEnabled()).toBe(true);
  });

  it("returns false for Variant B (Appearance hidden)", () => {
    mockIsAppearanceSettingsEnabled.mockReturnValue(false);
    expect(isDarkModeFeatureEnabled()).toBe(false);
  });
});
