import {
  applyMarketingDeepLinkEscape,
  bootstrapNavigationForDeepLink,
  isDeepLinkGateRoute,
  prepareAppForDeepLinkEntry,
} from "./deepLinkAuthFlow";
import { deepLinkManager } from "./deepLinkManager";

const mockMarkPostAuthCompleted = jest.fn();
const mockSetHasCompletedOnboarding = jest.fn();
const mockReset = jest.fn();
const mockResetToResolvedDestination = jest.fn(() => true);
const mockNavigate = jest.fn();
const mockOnApplied = jest.fn();
const mockGuestLogin = jest.fn();

let mockAuthState: {
  isAuthenticated: boolean;
  token: string | null;
  user: { id: string } | null;
  guestLogin: typeof mockGuestLogin;
  guestId: null;
} = {
  isAuthenticated: false,
  token: null,
  user: null,
  guestLogin: mockGuestLogin,
  guestId: null,
};

jest.mock("@react-native-async-storage/async-storage", () => ({
  setItem: jest.fn(async () => undefined),
  removeItem: jest.fn(async () => undefined),
  getItem: jest.fn(async () => null),
}));

jest.mock("../../lib/env/appEnv", () => ({
  isDevIntent: () => false,
}));

jest.mock("../../features/auth/auth.store", () => ({
  useAuthStore: {
    getState: () => mockAuthState,
  },
}));

jest.mock("../../features/subscription/subscription.store", () => ({
  selectIsPremium: () => false,
  useSubscriptionStore: {
    getState: () => ({ syncFromAuthStore: jest.fn() }),
  },
}));

jest.mock("../../features/onboarding/onboarding.store", () => ({
  useOnboardingStore: {
    getState: () => ({
      setHasCompletedOnboarding: mockSetHasCompletedOnboarding,
    }),
  },
}));

jest.mock("../../features/post-auth-onboarding/post-auth-onboarding.store", () => ({
  usePostAuthOnboardingStore: {
    getState: () => ({
      markCompleted: mockMarkPostAuthCompleted,
    }),
  },
}));

jest.mock("./deepLinkAnalytics", () => ({
  logDeepLinkReceived: jest.fn(),
  logDeepLinkApplied: jest.fn(),
  logDeepLinkSkipped: jest.fn(),
}));

jest.mock("../../utils/navigation", () => ({
  NavigationService: {
    reset: (...args: unknown[]) => mockReset(...args),
    resetToResolvedDestination: (...args: unknown[]) =>
      mockResetToResolvedDestination(...args),
  },
}));

describe("deepLinkAuthFlow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    deepLinkManager._resetStateForTests();
    mockAuthState = {
      isAuthenticated: false,
      token: null,
      user: null,
      guestLogin: mockGuestLogin,
      guestId: null,
    };
    mockGuestLogin.mockImplementation(async () => {
      mockAuthState = {
        isAuthenticated: true,
        token: "token",
        user: { id: "1" },
        guestLogin: mockGuestLogin,
        guestId: null,
      };
    });
  });

  it("identifies gate routes", () => {
    expect(isDeepLinkGateRoute("Onboarding")).toBe(true);
    expect(isDeepLinkGateRoute("MainTabs")).toBe(false);
    expect(isDeepLinkGateRoute(undefined)).toBe(false);
  });

  it("marks first-run and post-auth onboarding complete", () => {
    prepareAppForDeepLinkEntry();
    expect(mockSetHasCompletedOnboarding).toHaveBeenCalledWith(true);
    expect(mockMarkPostAuthCompleted).toHaveBeenCalled();
  });

  it("resets to the pending tab destination when a link is queued on a blocking gate screen", () => {
    deepLinkManager.handle("https://birdzy-app.web.app/collection");
    const didBootstrap = bootstrapNavigationForDeepLink(() => "PostAuthOnboarding");
    expect(didBootstrap).toBe(true);
    expect(mockResetToResolvedDestination).toHaveBeenCalled();
    expect(mockReset).not.toHaveBeenCalled();
    expect(mockSetHasCompletedOnboarding).toHaveBeenCalledWith(true);
  });

  it("leaves Onboarding for the pending destination", () => {
    deepLinkManager.handle("https://birdzy-app.web.app/collection");
    const didBootstrap = bootstrapNavigationForDeepLink(() => "Onboarding");
    expect(didBootstrap).toBe(true);
    expect(mockResetToResolvedDestination).toHaveBeenCalled();
  });

  it("stays on Splash until apply (does not bootstrap-reset away from splash)", () => {
    deepLinkManager.handle("https://birdzy-app.web.app/collection");
    const didBootstrap = bootstrapNavigationForDeepLink(() => "Splash");
    expect(didBootstrap).toBe(false);
    expect(mockResetToResolvedDestination).not.toHaveBeenCalled();
    expect(mockReset).not.toHaveBeenCalled();
  });

  it("does not reset when already on MainTabs", () => {
    deepLinkManager.handle("https://birdzy-app.web.app/collection");
    const didBootstrap = bootstrapNavigationForDeepLink(() => "MainTabs");
    expect(didBootstrap).toBe(false);
    expect(mockReset).not.toHaveBeenCalled();
  });

  it("applyMarketingDeepLinkEscape skips gate, logs in, applies, and notifies caller", async () => {
    deepLinkManager.handle("https://birdzy-app.web.app/feed");

    const result = await applyMarketingDeepLinkEscape({
      getActiveRoute: () => "Onboarding",
      isNavigatorReady: () => true,
      navigate: mockNavigate,
      onDeepLinkApplied: mockOnApplied,
    });

    expect(result).toBe("applied");
    expect(mockGuestLogin).toHaveBeenCalled();
    expect(mockReset).not.toHaveBeenCalled();
    expect(mockOnApplied).toHaveBeenCalled();
    expect(deepLinkManager.getPendingDestination()).toBeNull();
  });

  it("from Splash skips onboarding and applies the pending destination without Home first", async () => {
    deepLinkManager.handle("https://birdzy-app.web.app/settings");

    const result = await applyMarketingDeepLinkEscape({
      getActiveRoute: () => "Splash",
      isNavigatorReady: () => true,
      navigate: mockNavigate,
      onDeepLinkApplied: mockOnApplied,
    });

    expect(result).toBe("applied");
    expect(mockGuestLogin).toHaveBeenCalled();
    expect(mockReset).not.toHaveBeenCalled();
    expect(mockResetToResolvedDestination).toHaveBeenCalled();
    expect(mockSetHasCompletedOnboarding).toHaveBeenCalledWith(true);
    expect(mockOnApplied).toHaveBeenCalled();
    expect(deepLinkManager.getPendingDestination()).toBeNull();
  });

  it("from Splash opens Find Your Mushroom for quiz, not Home or Subscription", async () => {
    deepLinkManager.handle("https://birdzy-app.web.app/quiz");

    const result = await applyMarketingDeepLinkEscape({
      getActiveRoute: () => "Splash",
      isNavigatorReady: () => true,
      navigate: mockNavigate,
      onDeepLinkApplied: mockOnApplied,
    });

    expect(result).toBe("applied");
    expect(mockReset).not.toHaveBeenCalled();
    expect(mockResetToResolvedDestination).toHaveBeenCalledWith(
      expect.objectContaining({
        screen: "BirdPersonalityStack",
        params: expect.objectContaining({ screen: "BirdPersonalityIntro" }),
      }),
      undefined
    );
  });

  it("guest-logs in even when navigator is not ready yet", async () => {
    deepLinkManager.handle("https://birdzy-app.web.app/home");

    const result = await applyMarketingDeepLinkEscape({
      getActiveRoute: () => "Splash",
      isNavigatorReady: () => false,
      navigate: mockNavigate,
      onDeepLinkApplied: mockOnApplied,
    });

    expect(result).toBe("waiting_navigator");
    expect(mockGuestLogin).toHaveBeenCalled();
    expect(mockOnApplied).not.toHaveBeenCalled();
    expect(deepLinkManager.getPendingDestination()).not.toBeNull();
  });
});
