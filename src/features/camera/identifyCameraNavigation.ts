/**
 * Shared identify camera navigation — primary tab + external returns (Ask AI, Feed, Quiz).
 * Permission is handled inline on CameraMain (same as identification tab).
 */

import { NavigationService } from "../../utils/navigation";
import { CommonActions } from "@react-navigation/native";
import { useIdentificationEntryStore } from "./identificationEntry.store";

export type CropReturnTarget =
  | "camera"
  | "analysis"
  | "askAi"
  | "feed"
  | "quiz";

/** Camera stack routes that keep external return context alive. */
export const CAMERA_FLOW_CHILD_ROUTES = [
  "IdentifyImageCrop",
  "GalleryPicker",
  "DiagnosisLoading",
] as const;

export type ExternalCameraReturnTarget = Exclude<
  CropReturnTarget,
  "camera" | "analysis"
>;

export type FeedCameraDraft = {
  title?: string;
  content?: string;
  itemName?: string;
  postId?: string;
};

export type IdentifyCameraMainParams = {
  returnImageToAskAI?: boolean;
  returnImageToFeed?: boolean;
  returnImageToQuiz?: boolean;
  feedDraft?: FeedCameraDraft;
  pendingCrop?: {
    uri: string;
    displayUri?: string;
    width?: number;
    height?: number;
  };
  resetCapture?: boolean;
};

export type IdentifyGalleryPickerParams = {
  returnImageToAskAI?: boolean;
  returnImageToFeed?: boolean;
  returnImageToQuiz?: boolean;
  feedDraft?: FeedCameraDraft;
  currentImageCount?: number;
};

/** React Navigation keeps existing param values when set to `undefined`. */
export const CLEAR_EXTERNAL_CAMERA_ROUTE_PARAMS = {
  returnImageToAskAI: false,
  returnImageToFeed: false,
  returnImageToQuiz: false,
  feedDraft: undefined,
} as const satisfies IdentifyCameraMainParams;

export function hasExternalCameraRouteParams(
  params:
    | IdentifyCameraMainParams
    | IdentifyGalleryPickerParams
    | undefined
    | null
): boolean {
  return !!(
    params?.returnImageToAskAI ||
    params?.returnImageToFeed ||
    params?.returnImageToQuiz
  );
}

export function clearExternalCameraRouteParams(navigation: {
  setParams: (params: Partial<IdentifyCameraMainParams>) => void;
}): void {
  navigation.setParams({ ...CLEAR_EXTERNAL_CAMERA_ROUTE_PARAMS });
}

/** Reset camera stack to a clean identify entry after external return. */
export function resetCameraStackAfterExternalReturn(navigation: {
  reset: (state: {
    index: number;
    routes: Array<{ name: "CameraMain"; params: IdentifyCameraMainParams }>;
  }) => void;
}): void {
  useIdentificationEntryStore.getState().setExternalCameraReturnTarget(null);
  navigation.reset({
    index: 0,
    routes: [
      { name: "CameraMain", params: { ...CLEAR_EXTERNAL_CAMERA_ROUTE_PARAMS } },
    ],
  });
}

/** Route params only — capture/crop routing must not trust stale store for identify tab. */
export function resolveCameraReturnTargetFromRoute(
  params:
    | IdentifyCameraMainParams
    | IdentifyGalleryPickerParams
    | undefined
    | null
): ExternalCameraReturnTarget | null {
  if (params?.returnImageToAskAI) return "askAi";
  if (params?.returnImageToFeed) return "feed";
  if (params?.returnImageToQuiz) return "quiz";
  return null;
}

export function resolveCameraReturnTarget(
  params:
    | IdentifyCameraMainParams
    | IdentifyGalleryPickerParams
    | undefined
    | null
): ExternalCameraReturnTarget | null {
  return (
    resolveCameraReturnTargetFromRoute(params) ??
    useIdentificationEntryStore.getState().externalCameraReturnTarget
  );
}

export function externalReturnFlagsForTarget(
  target: ExternalCameraReturnTarget | null | undefined
) {
  return {
    returnImageToAskAI: target === "askAi",
    returnImageToFeed: target === "feed",
    returnImageToQuiz: target === "quiz",
  };
}

/** Active external session — route params plus store fallback. */
export function resolveActiveExternalReturnTarget(
  params:
    | IdentifyCameraMainParams
    | IdentifyGalleryPickerParams
    | undefined
    | null
): ExternalCameraReturnTarget | null {
  return resolveCameraReturnTarget(params);
}

/** Keep route params and store aligned while the shared camera is open. */
export function syncExternalCameraSessionOnFocus(
  navigation: { setParams: (params: Partial<IdentifyCameraMainParams>) => void },
  params: IdentifyCameraMainParams | undefined
): void {
  const routeExternal = resolveCameraReturnTargetFromRoute(params);
  const storeTarget =
    useIdentificationEntryStore.getState().externalCameraReturnTarget;
  const explicitlyClearedForIdentify =
    params?.returnImageToAskAI === false &&
    params?.returnImageToFeed === false &&
    params?.returnImageToQuiz === false;

  if (storeTarget && !routeExternal) {
    if (explicitlyClearedForIdentify || params == null) {
      useIdentificationEntryStore.getState().setExternalCameraReturnTarget(null);
      return;
    }
    navigation.setParams(
      buildCameraMainParams(storeTarget, { feedDraft: params?.feedDraft })
    );
    return;
  }

  if (routeExternal && !storeTarget) {
    useIdentificationEntryStore
      .getState()
      .setExternalCameraReturnTarget(routeExternal);
    return;
  }

  if (!routeExternal && !storeTarget && hasExternalCameraRouteParams(params)) {
    clearExternalCameraRouteParams(navigation);
    return;
  }

  if (!routeExternal) {
    useIdentificationEntryStore.getState().setExternalCameraReturnTarget(null);
  }
}

export function resolveCropHostReturnTarget(params: {
  returnTarget: CropReturnTarget;
  returnImageToAskAI?: boolean;
  returnImageToFeed?: boolean;
  returnImageToQuiz?: boolean;
  feedDraft?: FeedCameraDraft | null;
}): CropReturnTarget {
  if (params.returnTarget === "analysis" && params.feedDraft != null) {
    return "feed";
  }

  const routeExternal = resolveCameraReturnTargetFromRoute(params);
  if (routeExternal) return routeExternal;

  if (params.returnTarget === "analysis") return "analysis";
  if (params.returnTarget === "camera") return "camera";

  if (
    params.returnTarget === "askAi" ||
    params.returnTarget === "feed" ||
    params.returnTarget === "quiz"
  ) {
    return params.returnTarget;
  }

  return "analysis";
}

/** Root navigator — stable across Camera stack depth changes. */
export function getAppRootNavigation(navigation: {
  getParent: () => unknown;
}): { navigate: (...args: unknown[]) => void } | null | undefined {
  let current: {
    getParent?: () => unknown;
    navigate?: (...args: unknown[]) => void;
  } | null = navigation as {
    getParent?: () => unknown;
    navigate?: (...args: unknown[]) => void;
  };
  while (current?.getParent?.()) {
    current = current.getParent() as typeof current;
  }
  return current?.navigate ? (current as { navigate: (...args: unknown[]) => void }) : null;
}

export function buildCameraMainParams(
  target: ExternalCameraReturnTarget,
  options?: { feedDraft?: FeedCameraDraft }
): IdentifyCameraMainParams {
  if (target === "askAi") return { returnImageToAskAI: true };
  if (target === "feed") {
    return {
      returnImageToFeed: true,
      ...(options?.feedDraft ? { feedDraft: options.feedDraft } : {}),
    };
  }
  return { returnImageToQuiz: true };
}

export function buildGalleryPickerParams(
  target: ExternalCameraReturnTarget | null,
  options?: { feedDraft?: FeedCameraDraft; currentImageCount?: number }
): IdentifyGalleryPickerParams | undefined {
  const base =
    options?.currentImageCount != null
      ? { currentImageCount: options.currentImageCount }
      : undefined;

  if (!target) return base;
  if (target === "askAi") return { ...base, returnImageToAskAI: true };
  if (target === "feed") {
    return {
      ...base,
      returnImageToFeed: true,
      ...(options?.feedDraft ? { feedDraft: options.feedDraft } : {}),
    };
  }
  return { ...base, returnImageToQuiz: true };
}

export function navigateToIdentifyCameraScreen(
  target: ExternalCameraReturnTarget,
  options?: { feedDraft?: FeedCameraDraft }
) {
  const ref = NavigationService.getNavigationRef();
  if (!ref?.isReady()) return;

  useIdentificationEntryStore.getState().setExternalCameraReturnTarget(target);

  ref.dispatch(
    CommonActions.navigate({
      name: "MainTabs",
      params: {
        screen: "Camera",
        params: {
          screen: "CameraMain",
          params: buildCameraMainParams(target, options),
        },
      },
    })
  );
}

export function navigateExternalCameraReturnResult(
  rootNav: { navigate: (...args: any[]) => void } | null | undefined,
  target: ExternalCameraReturnTarget,
  imageUri: string,
  feedDraft?: FeedCameraDraft
) {
  if (!rootNav) return;

  if (target === "askAi") {
    rootNav.navigate("AskAIStack", {
      screen: "AskAIMain",
      params: { selectedImageUri: imageUri },
    });
    return;
  }

  if (target === "feed") {
    rootNav.navigate("MainTabs", {
      screen: "Feed",
      params: {
        screen: "CreatePost",
        params: {
          editedImageUri: imageUri,
          title: feedDraft?.title,
          content: feedDraft?.content,
          itemName: feedDraft?.itemName,
          postId: feedDraft?.postId,
        },
      },
    });
    return;
  }

  rootNav.navigate("BirdPersonalityStack", {
    screen: "Questionnaire",
    params: { photoUri: imageUri },
  });
}
