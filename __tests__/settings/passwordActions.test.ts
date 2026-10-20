import {
  changePassword,
  createPassword,
} from "../../src/features/settings/passwordActions";
import { authService } from "../../src/features/auth/services/auth.service";
import { useAuthStore } from "../../src/features/auth/auth.store";

jest.mock("../../src/features/auth/services/auth.service", () => ({
  authService: { updateProfile: jest.fn(), login: jest.fn() },
}));
jest.mock("../../src/features/auth/auth.store", () => ({
  useAuthStore: { getState: () => ({ setToken: mockSetToken }) },
}));
const mockSetToken = jest.fn();
beforeEach(() => {
  jest.clearAllMocks();
});
it.each([changePassword, createPassword])(
  "updates through the authenticated profile endpoint",
  async (save) => {
    (authService.updateProfile as jest.Mock).mockResolvedValue({
      token: "rotated-token",
    });
    await save("StrongPass1!");
    expect(authService.updateProfile).toHaveBeenCalledWith({
      password: "StrongPass1!",
    });
    expect(authService.login).not.toHaveBeenCalled();
    expect(mockSetToken).toHaveBeenCalledWith("rotated-token");
  }
);
it("keeps the existing token and reports an update failure", async () => {
  (authService.updateProfile as jest.Mock).mockRejectedValue(
    new Error("Network unavailable")
  );
  await expect(changePassword("StrongPass1!")).rejects.toThrow();
  expect(mockSetToken).not.toHaveBeenCalled();
  expect(authService.login).not.toHaveBeenCalled();
});
