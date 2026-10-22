import React from "react";
import { act, create, ReactTestRenderer } from "react-test-renderer";
import { SplashScreenContent } from "../../src/app/SplashScreen";

jest.mock("../../src/components/AppImage", () => ({ AppImage: "SplashImage" }));
jest.mock("../../src/assets", () => ({
  Images: { onboardingSplash: 7 },
}));

it("paints splash.webp on every app open", async () => {
  let renderer: ReactTestRenderer;
  await act(async () => {
    renderer = create(<SplashScreenContent />);
  });
  const image = renderer!.root.findByType("SplashImage" as any);
  expect(image.props.source).toBe(7);
  expect(image.props.resizeMode).toBe("contain");
  expect(image.props.fadeDuration).toBe(0);
  expect(typeof image.props.style.width).toBe("number");
  expect(typeof image.props.style.height).toBe("number");
  await act(async () => {
    renderer!.unmount();
  });
});
