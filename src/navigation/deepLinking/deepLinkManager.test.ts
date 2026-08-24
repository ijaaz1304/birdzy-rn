import {
  resolveDeepLinkDestinationForApply,
  isSubscriptionDeepLinkDestination,
} from "./deepLinkManager";

jest.mock("../../utils/navigation", () => ({
  NavigationService: {
    resetToResolvedDestination: jest.fn(() => true),
  },
}));

jest.mock("./deepLinkAnalytics", () => ({
  logDeepLinkReceived: jest.fn(),
  logDeepLinkApplied: jest.fn(),
  logDeepLinkSkipped: jest.fn(),
}));

jest.mock("../../features/auth/auth.store", () => ({
  useAuthStore: {
    getState: () => ({
      isAuthenticated: true,
      token: "token",
      user: { id: "1" },
    }),
  },
}));

const mockGetState = jest.fn();

jest.mock("../../features/subscription/subscription.store", () => ({
  selectIsPremium: (s: { isPremium: boolean }) => s.isPremium,
  useSubscriptionStore: {
    getState: () => mockGetState(),
  },
}));

describe("deepLinkManager subscription resolution", () => {
  beforeEach(() => {
    mockGetState.mockReset();
  });

  it("detects subscription stack destinations", () => {
    expect(
      isSubscriptionDeepLinkDestination({
        screen: "SubscriptionStack",
        params: { screen: "SubscriptionMain" },
      })
    ).toBe(true);
    expect(
      isSubscriptionDeepLinkDestination({
        screen: "MainTabs",
        params: { screen: "Home" },
      })
    ).toBe(false);
  });

  it("routes subscribed users to Home from /subs", () => {
    mockGetState.mockReturnValue({ isPremium: true });
    const resolved = resolveDeepLinkDestinationForApply({
      screen: "SubscriptionStack",
      params: { screen: "SubscriptionMain", params: { comingFrom: "deepLink" } },
    });
    expect(resolved.screen).toBe("MainTabs");
    expect(resolved.params).toMatchObject({
      screen: "Home",
      params: { screen: "HomeMain" },
    });
  });

  it("routes free users to paywall with deepLink source", () => {
    mockGetState.mockReturnValue({ isPremium: false });
    const resolved = resolveDeepLinkDestinationForApply({
      screen: "SubscriptionStack",
      params: { screen: "SubscriptionMain" },
    });
    expect(resolved.screen).toBe("SubscriptionStack");
    expect(resolved.params).toMatchObject({
      screen: "SubscriptionMain",
      params: { comingFrom: "deepLink" },
    });
  });

  it("passes through non-subscription destinations unchanged", () => {
    mockGetState.mockReturnValue({ isPremium: false });
    const feed = {
      screen: "MainTabs" as const,
      params: {
        screen: "Feed" as const,
        params: { screen: "FeedMain" as const },
      },
    };
    expect(resolveDeepLinkDestinationForApply(feed)).toEqual(feed);
  });
});
