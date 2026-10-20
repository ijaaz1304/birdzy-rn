import { validateImageQuality } from "../../src/features/camera/camera.utils";
jest.mock("react-native-vision-camera", () => ({ Camera: {} }));
jest.mock("react-native-image-picker", () => ({
  launchImageLibrary: jest.fn(),
}));
it("accepts 5MB and rejects larger images before submission", () => {
  expect(validateImageQuality(1000, 1000, 5 * 1024 * 1024).valid).toBe(true);
  expect(validateImageQuality(1000, 1000, 5 * 1024 * 1024 + 1)).toEqual({
    valid: false,
    warning: expect.stringContaining("5MB"),
  });
});
