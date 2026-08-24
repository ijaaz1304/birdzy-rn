import {
  mapThemeDefaultToMode,
  mapThemeDefaultToVariant,
} from "./themeExperiment.mapping";

describe("mapThemeDefaultToMode", () => {
  it("maps system and variant_a to system", () => {
    expect(mapThemeDefaultToMode("system")).toBe("system");
    expect(mapThemeDefaultToMode("variant_a")).toBe("system");
    expect(mapThemeDefaultToMode("SYSTEM")).toBe("system");
  });

  it("maps light and variant_b to light", () => {
    expect(mapThemeDefaultToMode("light")).toBe("light");
    expect(mapThemeDefaultToMode("variant_b")).toBe("light");
  });

  it("falls back to system for unknown values", () => {
    expect(mapThemeDefaultToMode("unknown")).toBe("system");
    expect(mapThemeDefaultToMode("")).toBe("system");
  });
});

describe("mapThemeDefaultToVariant", () => {
  it("maps system aliases to variant_a", () => {
    expect(mapThemeDefaultToVariant("system")).toBe("variant_a");
    expect(mapThemeDefaultToVariant("variant_a")).toBe("variant_a");
  });

  it("maps light aliases to variant_b", () => {
    expect(mapThemeDefaultToVariant("light")).toBe("variant_b");
    expect(mapThemeDefaultToVariant("variant_b")).toBe("variant_b");
  });
});
