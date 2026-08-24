import { buildDeepLinkResetState } from "./deepLinkNavigation";

describe("buildDeepLinkResetState", () => {
  it("keeps MainTabs in back stack for overlay stacks", () => {
    const state = buildDeepLinkResetState({
      screen: "SettingsStack",
      params: { screen: "SettingsMain" },
    });
    expect(state.index).toBe(1);
    expect(state.routes).toHaveLength(2);
    expect(state.routes[0]?.name).toBe("MainTabs");
    expect(state.routes[1]?.name).toBe("SettingsStack");
  });

  it("opens Find Your Mushroom as the focused overlay, not Home", () => {
    const state = buildDeepLinkResetState({
      screen: "BirdPersonalityStack",
      params: { screen: "BirdPersonalityIntro" },
    });
    expect(state.index).toBe(1);
    expect(state.routes[state.index]?.name).toBe("BirdPersonalityStack");
  });

  it("resets tab routes with nested tab state so the target tab is focused", () => {
    const state = buildDeepLinkResetState({
      screen: "MainTabs",
      params: {
        screen: "Collection",
        params: { screen: "CollectionMain" },
      },
    });
    expect(state.index).toBe(0);
    expect(state.routes).toHaveLength(1);
    const mainTabs = state.routes[0];
    expect(mainTabs?.name).toBe("MainTabs");
    expect(mainTabs?.state?.index).toBe(4);
    expect(mainTabs?.state?.routes.map((route) => route.name)).toEqual([
      "Home",
      "Catalogue",
      "Camera",
      "Feed",
      "Collection",
    ]);
    expect(mainTabs?.state?.routes[4]?.state?.routes[0]?.name).toBe(
      "CollectionMain"
    );
  });

  it("focuses Feed via nested tab state", () => {
    const state = buildDeepLinkResetState({
      screen: "MainTabs",
      params: {
        screen: "Feed",
        params: { screen: "FeedMain" },
      },
    });
    expect(state.routes[0]?.state?.index).toBe(3);
    expect(state.routes[0]?.state?.routes[3]?.state?.routes[0]?.name).toBe(
      "FeedMain"
    );
  });
});
