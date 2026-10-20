import { shouldShowLogoutAction } from "../../src/features/settings/utils/accountActions";

describe("shouldShowLogoutAction", () => {
  it("hides logout for guest users (isGuest flag)", () => {
    expect(shouldShowLogoutAction({ isGuest: true }, null)).toBe(false);
  });

  it("hides logout when a guestId is present", () => {
    expect(shouldShowLogoutAction({ isGuest: false }, "guest-123")).toBe(false);
  });

  it("shows logout for signed-in non-guest users", () => {
    expect(shouldShowLogoutAction({ isGuest: false }, null)).toBe(true);
  });
});
