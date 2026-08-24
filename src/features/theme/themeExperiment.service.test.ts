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
      "locks to light and hides Appearance for %s",
      (value) => {
        mockGetRemoteConfigValue.mockReturnValue(value);
        expect(getThemeExperimentVariant()).toBe("variant_b");
        expect(isAppearanceSettingsEnabled()).toBe(false);
        expect(isThemeLockedToLight()).toBe(true);
      }
    );

    it("forces light theme on apply", () => {
      mockGetRemoteConfigValue.mockReturnValue("light");
      applyThemeExperimentFromRemoteConfig();
      expect(mockForceExperimentTheme).toHaveBeenCalledWith("light");
      expect(mockNotifyExperimentApplied).toHaveBeenCalled();
    });
  });
});
