/** The words of the location popup that asks before the system prompt. */

const copyFor = (os: "android" | "ios") => {
  let copy: { title: string; subtitle: string; continueLabel: string } | undefined;
  jest.isolateModules(() => {
    jest.doMock("react-native", () => ({ Platform: { OS: os } }));
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getLocationFirstAskUiCopy } = require("../../src/services/permissions/permissionUiCopy");
    copy = getLocationFirstAskUiCopy();
  });
  return copy!;
};

test("on Android the popup is the Enable Location Access popup of the design", () => {
  const copy = copyFor("android");
  expect(copy.title).toBe("Enable Location Access");
  expect(copy.subtitle).toBe(
    "Our identification accuracy exceeds 90% with location access."
  );
  expect(copy.continueLabel).toBe("Allow Location");
});

test("the popup no longer talks about weather or plant care", () => {
  for (const os of ["android", "ios"] as const) {
    const copy = copyFor(os);
    const text = `${copy.title} ${copy.subtitle} ${copy.continueLabel}`.toLowerCase();
    expect(text).not.toContain("weather");
    expect(text).not.toContain("plant");
    expect(text).not.toContain("grant location access");
  }
});

test("on iOS the popup keeps its neutral wording and a Continue button, as App Review needs", () => {
  const copy = copyFor("ios");
  expect(copy.title).toBe("Improve Identification With Location");
  expect(copy.continueLabel).toBe("Continue");
});
