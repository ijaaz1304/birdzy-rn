jest.mock("../../src/features/auth/services/auth.service", () => ({
  authService: { getProfile: jest.fn() },
}));
import { authService } from "../../src/features/auth/services/auth.service";
import { useAuthStore } from "../../src/features/auth/auth.store";
it("clears the visible loader when a concurrent silent refresh applies a rotated token first", async () => {
  const user = { id: "shared-profile", isPremium: false } as any;
  let finish!: (value: any) => void;
  const pending = new Promise((resolve) => {
    finish = resolve;
  });
  (authService.getProfile as jest.Mock).mockReturnValue(pending);
  useAuthStore.setState({
    user,
    token: "original",
    isAuthenticated: true,
    isLoading: false,
  });
  const silent = useAuthStore.getState().refreshProfileSilent();
  const visible = useAuthStore.getState().getProfile();
  finish({ user: { ...user, name: "Updated" }, token: "rotated" });
  await Promise.all([silent, visible]);
  expect(useAuthStore.getState().token).toBe("rotated");
  expect(useAuthStore.getState().isLoading).toBe(false);
});
it("does not apply an old account profile after the active account changes", async () => {
  let finish!: (value: any) => void;
  (authService.getProfile as jest.Mock).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      })
  );
  useAuthStore.setState({
    user: { id: "old" } as any,
    token: "old",
    isAuthenticated: true,
  });
  const pending = useAuthStore.getState().refreshProfileSilent();
  useAuthStore.setState({ user: { id: "new" } as any, token: "new" });
  finish({ user: { id: "old" }, token: "old-response" });
  await pending;
  expect(useAuthStore.getState().user?.id).toBe("new");
  expect(useAuthStore.getState().token).toBe("new");
});
it("clears the visible loader when the account changes during getProfile", async () => {
  let finish!: (value: any) => void;
  (authService.getProfile as jest.Mock).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      })
  );
  useAuthStore.setState({
    user: { id: "old" } as any,
    token: "old",
    isAuthenticated: true,
    isLoading: false,
  });
  const pending = useAuthStore.getState().getProfile();
  useAuthStore.setState({
    user: { id: "new" } as any,
    token: "new",
    isLoading: true,
  });
  finish({ user: { id: "old" }, token: "old-response" });
  await pending;
  expect(useAuthStore.getState().user?.id).toBe("new");
  expect(useAuthStore.getState().isLoading).toBe(false);
});
