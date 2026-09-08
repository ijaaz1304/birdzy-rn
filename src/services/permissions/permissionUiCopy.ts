/**
 * Platform-specific permission pre-prompt copy.
 * iOS: App Review spec (Continue, Open Settings, Manage … Access titles).
 * Android: legacy Grant … / Go to Settings wording (unchanged).
 */

import { Platform } from "react-native";
import { CAMERA_STRINGS } from "../../config/strings/camera.strings";
import { MODAL_STRINGS } from "../../config/strings/modals.strings";
import { PERMISSIONS_STRINGS } from "../../config/strings/permissions.strings";
import type { PermissionType } from "./permission.service";

export type PermissionPromptCopy = {
  title: string;
  subtitle: string;
  continueLabel: string;
  allowAccessLabel?: string;
  openSettingsLabel: string;
  deniedTitle?: string;
  deniedSubtitle?: string;
};

const isIos = Platform.OS === "ios";

export function getCameraPermissionUiCopy(): PermissionPromptCopy {
  const c = MODAL_STRINGS.bottomSheets.cameraPermission;
  return {
    title: c.title,
    subtitle: c.subtitle,
    continueLabel: c.enableButton,
    allowAccessLabel: c.allowAccessButton,
    openSettingsLabel: c.openSettings,
    deniedTitle: c.deniedTitle,
    deniedSubtitle: c.deniedSubtitle,
  };
}

export function getCameraAccessPopupUiCopy(): PermissionPromptCopy {
  if (isIos) {
    const screen = CAMERA_STRINGS.screen;
    const modal = MODAL_STRINGS.bottomSheets.cameraPermission;
    return {
      title: screen.cameraAccessTitle,
      subtitle: screen.cameraAccessMessage,
      continueLabel: CAMERA_STRINGS.buttons.continue,
      openSettingsLabel: CAMERA_STRINGS.buttons.openSettings,
      deniedTitle: modal.deniedTitle,
      deniedSubtitle: modal.deniedSubtitle,
    };
  }
  const c = PERMISSIONS_STRINGS.camera;
  return {
    title: c.title,
    subtitle: c.message,
    continueLabel: c.buttonLabel,
    openSettingsLabel: "Go to Settings",
    deniedTitle: c.title,
    deniedSubtitle: c.message,
  };
}

export function getLocationFirstAskUiCopy(): PermissionPromptCopy {
  if (isIos) {
    const c = MODAL_STRINGS.bottomSheets.enableLocation;
    return {
      title: c.title,
      subtitle: c.subtitle,
      continueLabel: c.enableButton,
      openSettingsLabel: MODAL_STRINGS.bottomSheets.locationManageAccess.goToSettings,
    };
  }
  const c = PERMISSIONS_STRINGS.location;
  return {
    title: c.title,
    subtitle: c.message,
    continueLabel: c.buttonLabel,
    openSettingsLabel: "Go to Settings",
  };
}

export function getLocationManageAccessUiCopy(): {
  title: string;
  subtitle: string;
  openSettingsLabel: string;
  customLocationLabel: string;
} {
  const c = MODAL_STRINGS.bottomSheets.locationManageAccess;
  return {
    title: c.title,
    subtitle: c.subtitle,
    openSettingsLabel: isIos ? c.goToSettings : "Go to Settings",
    customLocationLabel: c.customLocation,
  };
}

export function getGalleryPermissionUiCopy(): PermissionPromptCopy {
  if (isIos) {
    const c = CAMERA_STRINGS.galleryAccess;
    const pop = MODAL_STRINGS.popups.enableGallery;
    return {
      title: c.title,
      subtitle: c.subtitle,
      continueLabel: c.continue,
      openSettingsLabel: c.openSettings,
      deniedTitle: pop.deniedTitle,
      deniedSubtitle: pop.deniedSubtitle,
    };
  }
  const c = PERMISSIONS_STRINGS.storage;
  return {
    title: c.title,
    subtitle: c.message,
    continueLabel: c.buttonLabel,
    openSettingsLabel: "Go to Settings",
    deniedTitle: c.title,
    deniedSubtitle: c.message,
  };
}

export function getNotificationPermissionUiCopy(): PermissionPromptCopy {
  const c = MODAL_STRINGS.bottomSheets.pushNotifications;
  return {
    title: c.title,
    subtitle: c.subtitle,
    continueLabel: c.enableButton,
    openSettingsLabel: isIos ? c.openSettings : "Go to Settings",
  };
}

export function getPostAuthLocationUiCopy(): {
  title: string;
  subtitle: string;
  continueLabel: string;
} {
  if (isIos) {
    const c = MODAL_STRINGS.bottomSheets.enableLocation;
    return {
      title: c.title,
      subtitle: c.subtitle,
      continueLabel: c.enableButton,
    };
  }
  const c = CAMERA_STRINGS.galleryLocationAccess;
  return {
    title: c.title,
    subtitle: c.subtitle,
    continueLabel: c.continue,
  };
}

export function getPostAuthNotificationUiCopy(): {
  title: string;
  subtitle: string;
  continueLabel: string;
} {
  if (isIos) {
    return {
      title: "Important updates can come fast — don't miss them.",
      subtitle:
        "Get alerts for new mushroom finds, safety warnings, and similar species.",
      continueLabel: MODAL_STRINGS.bottomSheets.pushNotifications.enableButton,
    };
  }
  return {
    title: "Important updates can come fast — don't miss them.",
    subtitle:
      "Get alerts for new mushroom finds, safety warnings, and similar species.",
    continueLabel: MODAL_STRINGS.bottomSheets.pushNotifications.enableButton,
  };
}

export function getPermissionModalUiCopy(
  permissionType: PermissionType
): PermissionPromptCopy & { dismissLabel: string } {
  const legacy = PERMISSIONS_STRINGS[permissionType as keyof typeof PERMISSIONS_STRINGS];
  if (isIos) {
    switch (permissionType) {
      case "camera":
        return { ...getCameraPermissionUiCopy(), dismissLabel: "" };
      case "location":
        return { ...getLocationFirstAskUiCopy(), dismissLabel: "" };
      case "notifications":
        return { ...getNotificationPermissionUiCopy(), dismissLabel: "" };
      case "storage":
      case "photos":
        return { ...getGalleryPermissionUiCopy(), dismissLabel: "" };
      default:
        return {
          title: legacy.title,
          subtitle: legacy.message,
          continueLabel: "Continue",
          openSettingsLabel: "Open Settings",
          dismissLabel: "",
        };
    }
  }
  return {
    title: legacy.title,
    subtitle: legacy.message,
    continueLabel: legacy.buttonLabel,
    openSettingsLabel: "Go to Settings",
    dismissLabel: "Later",
  };
}

export function getEnablePushModalUiCopy(): PermissionPromptCopy {
  if (isIos) {
    return getNotificationPermissionUiCopy();
  }
  return {
    title: "Enable Push Notifications",
    subtitle:
      "Get notified about new mushrooms, identification updates, and community activity.",
    continueLabel: "Continue",
    openSettingsLabel: "Go to Settings",
  };
}

export function getPermissionAlertSettingsLabel(): string {
  return isIos ? "Open Settings" : "Go to Settings";
}
