jest.mock("react-native-device-info", () => ({
  getVersion: jest.fn(() => "2.7.4"),
}));
import { getVersion } from "react-native-device-info";
import { useVersionStore } from "../../src/features/version/version.store";
beforeEach(() => {
  useVersionStore.getState().reset();
  jest.clearAllMocks();
});
test("uses the installed app version instead of the JavaScript placeholder", async () => {
  await useVersionStore.getState().checkVersion();
  expect(getVersion).toHaveBeenCalled();
  expect(useVersionStore.getState()).toMatchObject({
    isLoading: false,
    error: null,
    versionInfo: {
      currentVersion: "2.7.4",
      latestVersion: "2.7.4",
      isUpdateRequired: false,
      isUpdateAvailable: false,
    },
  });
});
