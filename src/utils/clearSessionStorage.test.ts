import AsyncStorage from "@react-native-async-storage/async-storage";
import { UI_STATE_KEYS } from "../constants/storageConstants";
import {
  clearSessionStorage,
  PRESERVED_STORAGE_KEYS_ON_LOGOUT,
} from "./clearSessionStorage";

jest.mock("@react-native-async-storage/async-storage", () => ({
  getAllKeys: jest.fn(),
  multiRemove: jest.fn(),
}));

describe("clearSessionStorage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("preserves theme storage on logout cleanup", async () => {
    (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue([
      UI_STATE_KEYS.THEME,
      "auth-storage",
      "onboarding-storage",
    ]);
    (AsyncStorage.multiRemove as jest.Mock).mockResolvedValue(undefined);

    await clearSessionStorage();

    expect(AsyncStorage.multiRemove).toHaveBeenCalledWith([
      "auth-storage",
      "onboarding-storage",
    ]);
    expect(PRESERVED_STORAGE_KEYS_ON_LOGOUT).toContain(UI_STATE_KEYS.THEME);
    expect(PRESERVED_STORAGE_KEYS_ON_LOGOUT).not.toContain("onboarding-storage");
  });

  it("does not call multiRemove when only preserved keys exist", async () => {
    (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue([
      UI_STATE_KEYS.THEME,
    ]);

    await clearSessionStorage();

    expect(AsyncStorage.multiRemove).not.toHaveBeenCalled();
  });
});
