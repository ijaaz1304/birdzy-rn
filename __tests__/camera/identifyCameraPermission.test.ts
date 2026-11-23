/**
 * Figma 8558:25287 "camera permission" flow rules, checked against the decision helpers.
 * Rule: the native camera dialog is shown only twice; after two denials the user always
 * sees "Go to Settings". (iOS can only show the native dialog once — OS limitation.)
 */
import { Platform } from "react-native";
import {
  resolveCameraPermissionInlineVariant,
  shouldRunNativeCameraPrompt,
} from "../../src/features/camera/identifyCameraPermission.helpers";

const notBlocked = { blocked: false, canRequestAgain: true };
const blocked = { blocked: true, canRequestAgain: false };

function setOS(os: "ios" | "android") {
  Object.defineProperty(Platform, "OS", { get: () => os, configurable: true });
}

describe("identify camera permission — Android (Figma rule: native dialog twice)", () => {
  beforeEach(() => setOS("android"));

  it("Case 1: deny → Allow Access → tap → native again → deny → Go to Settings", () => {
    // Camera page, first visit: native dialog is shown.
    expect(shouldRunNativeCameraPrompt(0, notBlocked)).toBe(true);
    // Don't Allow (attempt 1) → custom "Allow Access".
    expect(resolveCameraPermissionInlineVariant(1, notBlocked)).toBe("allowAccess");
    // Tap "Allow Access" → native dialog (2nd & final time).
    expect(shouldRunNativeCameraPrompt(1, notBlocked)).toBe(true);
    // Don't Allow (attempt 2) → "Go to Settings" (default from now on).
    expect(resolveCameraPermissionInlineVariant(2, blocked)).toBe("goToSettings");
    // Next attempt: no native dialog, straight to Go to Settings.
    expect(shouldRunNativeCameraPrompt(2, blocked)).toBe(false);
    expect(resolveCameraPermissionInlineVariant(2, blocked)).toBe("goToSettings");
  });

  it("Case 2: visit 1 deny → Allow Access; visit 2 native → deny → Go to Settings; visit 3+ Go to Settings", () => {
    // Visit 1
    expect(shouldRunNativeCameraPrompt(0, notBlocked)).toBe(true);
    expect(resolveCameraPermissionInlineVariant(1, notBlocked)).toBe("allowAccess");
    // Visit 2 (user never tapped Allow Access): native dialog again
    expect(shouldRunNativeCameraPrompt(1, notBlocked)).toBe(true);
    expect(resolveCameraPermissionInlineVariant(2, notBlocked)).toBe("goToSettings");
    // Visit 3+
    expect(shouldRunNativeCameraPrompt(2, notBlocked)).toBe(false);
    expect(resolveCameraPermissionInlineVariant(2, notBlocked)).toBe("goToSettings");
  });

  it("goes straight to Go to Settings when the OS already blocks the dialog", () => {
    expect(shouldRunNativeCameraPrompt(0, blocked)).toBe(false);
    expect(resolveCameraPermissionInlineVariant(0, blocked)).toBe("goToSettings");
  });
});

describe("identify camera permission — iOS (OS allows one native dialog)", () => {
  beforeEach(() => setOS("ios"));

  it("first visit shows native dialog; after deny it is Go to Settings (no Allow Access)", () => {
    expect(shouldRunNativeCameraPrompt(0, notBlocked)).toBe(true);
    expect(resolveCameraPermissionInlineVariant(1, notBlocked)).toBe("goToSettings");
    expect(shouldRunNativeCameraPrompt(1, notBlocked)).toBe(false);
  });
});
