const mockGetRemoteConfigValue = jest.fn();

jest.mock("../../services/remoteConfig/remoteConfig.service", () => ({
  getRemoteConfigValue: (key: string) => mockGetRemoteConfigValue(key),
}));

jest.mock("../../services/analytics/analytics.service", () => ({
  analyticsService: {
    logEvent: jest.fn(),
    setUserProperties: jest.fn(),
  },
}));

jest.mock("../../constants/featureFlags", () => ({
  isDarkModeEnabledForApp: jest.fn(() => true),
}));

jest.mock("./theme.store", () => ({
  useThemeStore: {
    getState: jest.fn(),
    persist: {
      hasHydrated: () => true,
      onFinishHydration: (cb: () => void) => {
        cb();
        return () => undefined;
      },
    },
  },
}));

import {
  getThemeExperimentVariant,
  isAppearanceSettingsEnabled,
  isThemeLockedToLight,
  applyThemeExperimentFromRemoteConfig,
} from "./themeExperiment.service";
import { useThemeStore } from "./theme.store";

describe("themeExperiment.service", () => {
  const mockApplyExperimentDefault = jest.fn(() => false);
  const mockForceExperimentTheme = jest.fn(() => false);
  const mockNotifyExperimentApplied = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetRemoteConfigValue.mockImplementation((key: string) => {
      if (key === "theme_default") return "system";
      return undefined;
    });
    (useThemeStore.getState as jest.Mock).mockReturnValue({
      hasUserSelectedTheme: false,
      themeMode: "system",
      applyExperimentDefault: mockApplyExperimentDefault,
      forceExperimentTheme: mockForceExperimentTheme,
      notifyExperimentApplied: mockNotifyExperimentApplied,
    });
  });

  describe("Variant A (system / variant_a)", () => {
    it.each(["system", "variant_a"])(
      "enables Appearance settings for %s",
      (value) => {
        mockGetRemoteConfigValue.mockReturnValue(value);
        expect(getThemeExperimentVariant()).toBe("variant_a");
        expect(isAppearanceSettingsEnabled()).toBe(true);
        expect(isThemeLockedToLight()).toBe(false);
      }
    );
  });

  describe("Variant B (light / variant_b)", () => {
    it.each(["light", "variant_b"])(
      "keeps Appearance available and does not lock the theme for %s",
      (value) => {
        mockGetRemoteConfigValue.mockReturnValue(value);
        expect(getThemeExperimentVariant()).toBe("variant_b");
        expect(isAppearanceSettingsEnabled()).toBe(true);
        expect(isThemeLockedToLight()).toBe(false);
      }
    );

    it("applies light only as the initial theme", () => {
      mockGetRemoteConfigValue.mockReturnValue("light");
      applyThemeExperimentFromRemoteConfig();
      expect(mockApplyExperimentDefault).toHaveBeenCalledWith("light");
      expect(mockForceExperimentTheme).not.toHaveBeenCalled();
      expect(mockNotifyExperimentApplied).toHaveBeenCalled();
    });
  });
});
