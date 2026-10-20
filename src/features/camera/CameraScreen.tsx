import { requestFreeScanLimitPrompt } from "../../services/freeScanLimitPrompt";
/**
 * Camera Screen Component
 * Main camera interface for Identify flow using react-native-vision-camera.
 *
 * Implements:
 * - VisionCamera readiness gating (onInitialized/onError)
 * - Camera permission gate with "go to settings" only when blocked/after attempts
 * - Gallery pick → crop → add to camera slots (max 2) before identify submit
 * - Crop + processing pipeline
 * - Selected images preview (thumbnails, remove, submit)
 * - AppState re-check on returning from Settings
 * - Analytics hooks for screen + photo actions
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AppState,
  BackHandler,
  Platform,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  useFocusEffect,
  useIsFocused,
  useNavigation,
  useNavigationState,
  useRoute,
  RouteProp,
} from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Camera, PhotoFile, useCameraDevice } from "react-native-vision-camera";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { Images } from "../../assets";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../../hooks/useTheme";
import { useStrings } from "../../hooks/useStrings";
import { Text, NavBackIcon } from "../../atoms";
import { CameraStackParamList } from "../../navigation/types";
import { useIdentificationEntryStore } from "./identificationEntry.store";
import { CameraCaptureOverlay } from "./CameraCaptureOverlay";
import { CameraZoomControls } from "./CameraZoomControls";
import {
  useCaptureFrameLayout,
  uiZoomToDeviceZoom,
  CAPTURE_ZOOM_UI_MIN,
  CAPTURE_TOP_ICON_BUTTON_SIZE,
  CAPTURE_TOP_ICON_SIZE,
  CAPTURE_SIDE_BUTTON_SIZE,
  CAPTURE_SIDE_ICON_SIZE,
  CAPTURE_SHUTTER_OUTER_SIZE,
  CAPTURE_SHUTTER_RING_BORDER,
  CAPTURE_SHUTTER_INNER_SIZE,
} from "./captureFrameLayout";
import { CameraWarnings } from "./CameraWarnings";
import {
  CameraTipsModal,
  LimitReachedBottomSheet,
} from "../../molecules/Modal";
import { IdentificationLocationBanner } from "./components/IdentificationLocationBanner";
import { CameraImageSlots } from "./components/CameraImageSlots";
import { CameraIdentifyReview } from "./components/CameraIdentifyReview";
import { CameraPermissionInlineState } from "./components/CameraPermissionInlineState";
import { CameraDailyScanBanner } from "./components/CameraDailyScanBanner";
import { usePhotoIdentificationLimit } from "./hooks/usePhotoIdentificationLimit";
import { MAX_CAMERA_IDENTIFY_IMAGES } from "./utils/identificationLimitDisplay";
import { shouldShowLocationBannerAsGranted } from "./locationToggle.helpers";
import { useLocationToggleFlow } from "./useLocationToggleFlow";
import { useLocationPermissionUiStore } from "./locationPermissionUi.store";
import { createCameraStyles } from "./camera.styles";
import { checkCameraPermission } from "../../services/permissions";
import { useIdentifyCameraPermissionFlow } from "./useIdentifyCameraPermissionFlow";
import {
  buildGalleryPickerParams,
  CAMERA_FLOW_CHILD_ROUTES,
  externalReturnFlagsForTarget,
  resolveActiveExternalReturnTarget,
  syncExternalCameraSessionOnFocus,
} from "./identifyCameraNavigation";
import { CroppedImageObject, getMimeType } from "./cropImageAndReturnObject";
import {
  copyCaptureToStableCache,
  isEmulatorDevice,
  normalizeImageUriForCrop,
  releaseVisionCameraForNativeUi,
} from "./camera.utils";
import { useIdentifyImagePipeline } from "./hooks/useIdentifyImagePipeline";
import { analyticsService } from "../../services/analytics/analytics.service";
import { navigateToSubscriptionMain } from "../../utils/navigation";
import { EVENTS } from "../../services/analytics/analytics.events";
import {
  useSubscriptionStore,
  selectIsPremium,
} from "../../features/subscription/subscription.store";
import { INTERACTIVE_COLORS } from "../../constants/colorConstants";
import { SCREEN_STORAGE_KEYS } from "../../constants/storageConstants";
import { HIT_SLOP } from "../../constants/uiConstants";
import { APP_COLORS } from "../../config/colors";
import { AppImage, AppImageBackground } from "@/components/AppImage";
import { identifyFlowLog } from "./identifyFlowLog";

/** Hard deadline so shutter never stays disabled after a failed capture. */
const TAKE_PHOTO_TIMEOUT_MS = 15000;
const CAMERA_BG_FALLBACK = INTERACTIVE_COLORS.CAMERA_BG_FALLBACK;

const HAS_SEEN_CAMERA_TIPS_KEY = SCREEN_STORAGE_KEYS.HAS_SEEN_CAMERA_TIPS;

/** Height of CameraZoomControls row (track hit area). */
const ZOOM_CONTROLS_HEIGHT = 32;
const CAPTURE_CONTENT_GAP = 16;
const SUBMIT_BELOW_ZOOM_GAP = 12;

type CameraScreenNavigationProp = NativeStackNavigationProp<
  CameraStackParamList,
  "CameraMain"
>;
export const CameraScreen: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.mode === "dark";
  const identifyBackground = isDark ? Images.identifyBgDark : Images.identifyBg;
  const strings = useStrings();
  const cameraStyles = createCameraStyles(theme);
  const navigation = useNavigation<CameraScreenNavigationProp>();
  const route = useRoute<RouteProp<CameraStackParamList, "CameraMain">>();
  const isFocused = useIsFocused();
  const isCropRouteActive = useNavigationState(
    (state) => state.routes[state.index]?.name === "IdentifyImageCrop"
  );
  const cameraReturnTarget = resolveActiveExternalReturnTarget(route.params);
  const isExternalCameraReturn = cameraReturnTarget != null;
  const [isAppActive, setIsAppActive] = useState(
    AppState.currentState === "active"
  );
  const cameraRef = useRef<Camera>(null);
  const [cameraFacing, setCameraFacing] = useState<"back" | "front">("back");
  const device = useCameraDevice(cameraFacing);
  const insets = useSafeAreaInsets();
  const [locationBannerHeight, setLocationBannerHeight] = useState(0);
  const [captureControlsHeight, setCaptureControlsHeight] = useState(220);
  const [bottomControlsHeight, setBottomControlsHeight] = useState(120);
  const captureFrameLayout = useCaptureFrameLayout({
    minimumTop: insets.top + 68 + locationBannerHeight + 16,
    bottomInset:
      captureControlsHeight + bottomControlsHeight + CAPTURE_CONTENT_GAP + 12,
  });
  const hasShownTipsRef = useRef(false);
  const selectedImagesRef = useRef<CroppedImageObject[]>([]);

  const {
    hasPermission,
    permissionChecked,
    cameraPermissionInline,
    isNativeDialogActive,
    cameraPermissionLoading,
    runEntryPermissionFlow,
    resetEntryFlow,
    syncPermissionFromOs,
    handleCameraPermissionAction,
  } = useIdentifyCameraPermissionFlow(!!device);
  const [tipsCheckDone, setTipsCheckDone] = useState(false);
  const [screenFocused, setScreenFocused] = useState(false);
  const isCameraUiReady = tipsCheckDone && permissionChecked;

  const [zoomUi, setZoomUi] = useState(CAPTURE_ZOOM_UI_MIN);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [showTipsModal, setShowTipsModal] = useState(false);
  const [selectedImages, setSelectedImages] = useState<CroppedImageObject[]>(
    []
  );
  const [showHint, setShowHint] = useState(false);
  const [showUpgradeSheet, setShowUpgradeSheet] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  /** Explicit pause while crop host / child routes use the presentation layer. */
  const [isCameraActive, setIsCameraActive] = useState(true);
  /** Unmount VisionCamera so AVFoundation releases before native cropper (isActive=false is not enough). */
  const [shouldRenderCamera, setShouldRenderCamera] = useState(true);
  const [capturePreviewUri, setCapturePreviewUri] = useState<string | null>(
    null
  );
  /** When true, show live camera again so the user can capture a second photo. */
  const [isAddingAnotherPhoto, setIsAddingAnotherPhoto] = useState(false);
  const isPremium = useSubscriptionStore(selectIsPremium);
  const { limit: photoLimit, refresh: refreshPhotoLimit } =
    usePhotoIdentificationLimit(!isPremium);
  const { submitProcessed, isProcessing } = useIdentifyImagePipeline({
    navigation,
    isPremium,
    onLimitReached: requestFreeScanLimitPrompt,
    onError: (message) => {
      setWarning(message);
      setTimeout(() => setWarning(null), 3000);
    },
  });
  const isCapturingRef = useRef(false);
  const isCameraReadyRef = useRef(false);
  const isAddingAnotherPhotoRef = useRef(false);
  /** Guard: navigate() → stack update gap must not remount VisionCamera before crop host opens. */
  const pendingCropNavigationRef = useRef(false);
  const {
    location,
    permissionGranted: locationPermissionGranted,
    locationLabel,
    syncPermission,
    openCustomLocationSheet,
    isLocationPermissionFlowActive,
  } = useLocationToggleFlow();

  const setShowChangeLocationSheet = useLocationPermissionUiStore(
    (s) => s.setShowChangeLocationSheet
  );
  const showChangeLocationSheet = useLocationPermissionUiStore(
    (s) => s.showChangeLocationSheet
  );
  const setShowCustomPopup = useLocationPermissionUiStore(
    (s) => s.setShowCustomPopup
  );
  const showCustomPopup = useLocationPermissionUiStore(
    (s) => s.showCustomPopup
  );
  const showManagePopup = useLocationPermissionUiStore(
    (s) => s.showManagePopup
  );
  const setShowManagePopup = useLocationPermissionUiStore(
    (s) => s.setShowManagePopup
  );

  const handleLocationToggle = useCallback(
    (enabled: boolean) => {
      if (!enabled) return;
      openCustomLocationSheet();
    },
    [openCustomLocationSheet]
  );

  const deviceMinZoom = device?.minZoom ?? CAPTURE_ZOOM_UI_MIN;
  const deviceMaxZoom = Math.min(device?.maxZoom ?? 5, 5);
  const cameraZoom = uiZoomToDeviceZoom(zoomUi, deviceMinZoom, deviceMaxZoom);

  useEffect(() => {
    setTorchOn(false);
    setIsCameraReady(false);
    isCameraReadyRef.current = false;
  }, [cameraFacing]);

  useEffect(() => {
    isCameraReadyRef.current = isCameraReady;
  }, [isCameraReady]);

  const captureContentLayout = useMemo(() => {
    const frameBottom =
      captureFrameLayout.frameTop + captureFrameLayout.frameSize;
    return {
      top: frameBottom + CAPTURE_CONTENT_GAP,
    };
  }, [captureFrameLayout.frameSize, captureFrameLayout.frameTop]);

  useEffect(() => {
    selectedImagesRef.current = selectedImages;
  }, [selectedImages]);

  useEffect(() => {
    isAddingAnotherPhotoRef.current = isAddingAnotherPhoto;
  }, [isAddingAnotherPhoto]);

  const pendingCropUri = route.params?.pendingCrop?.uri;
  const pendingCropDisplayUri = route.params?.pendingCrop?.displayUri;
  const pendingCropWidth = route.params?.pendingCrop?.width;
  const pendingCropHeight = route.params?.pendingCrop?.height;
  const resetCapture = route.params?.resetCapture === true;

  const showIdentifyReview =
    selectedImages.length === 1 &&
    !isAddingAnotherPhoto &&
    !isExternalCameraReturn;

  const showCameraPermissionInline = !!cameraPermissionInline && !hasPermission;

  /** Allow Access / Go to Settings — plain gate UI only, no camera chrome. */
  const isCameraPermissionGateActive =
    permissionChecked &&
    !hasPermission &&
    !showIdentifyReview &&
    !capturePreviewUri;

  const formatImageCounter = useCallback(
    (current: number, max: number) =>
      strings.camera.multiPhoto.imageCounter
        .replace("{current}", String(current))
        .replace("{max}", String(max)),
    [strings.camera.multiPhoto.imageCounter]
  );

  const formatSubmitToast = useCallback(
    (count: number) =>
      (count === 1
        ? strings.camera.multiPhoto.submitPhotoToast
        : strings.camera.multiPhoto.submitPhotosToast
      ).replace("{count}", String(count)),
    [
      strings.camera.multiPhoto.submitPhotoToast,
      strings.camera.multiPhoto.submitPhotosToast,
    ]
  );

  useEffect(() => {
    if (!resetCapture) return;
    setSelectedImages([]);
    setIsAddingAnotherPhoto(false);
    navigation.setParams({ resetCapture: undefined });
  }, [navigation, resetCapture]);

  useEffect(() => {
    if (!pendingCropUri) return;
    const uri = pendingCropUri;
    const displayUri = pendingCropDisplayUri ?? uri;
    const previewUri = `${displayUri}${
      displayUri.includes("?") ? "&" : "?"
    }t=${Date.now()}`;
    const fileName =
      uri.split("/").pop()?.split("?")[0] || `image-${Date.now()}.jpg`;
    setSelectedImages((prev) => {
      if (prev.length >= MAX_CAMERA_IDENTIFY_IMAGES) return prev;
      const nextImage = {
        uri,
        previewUri,
        fileName,
        type: getMimeType(uri),
        width: pendingCropWidth,
        height: pendingCropHeight,
      };
      return [...prev, nextImage].slice(0, MAX_CAMERA_IDENTIFY_IMAGES);
    });
    setIsAddingAnotherPhoto(false);
    navigation.setParams({ pendingCrop: undefined });
    identifyFlowLog("preview_ready", { uriPrefix: uri.slice(0, 32) });
  }, [
    navigation,
    pendingCropDisplayUri,
    pendingCropHeight,
    pendingCropUri,
    pendingCropWidth,
  ]);

  const restoreCameraSession = useCallback(() => {
    setCapturePreviewUri(null);
    setShouldRenderCamera(true);
    setIsCameraActive(true);
    isCapturingRef.current = false;
    setIsCapturing(false);
    identifyFlowLog("camera_session_restored");
  }, []);

  const pauseCameraForCrop = useCallback(() => {
    setIsCameraActive(false);
    setShouldRenderCamera(false);
    identifyFlowLog("camera_paused_for_crop");
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!isCropRouteActive && !pendingCropNavigationRef.current) {
        restoreCameraSession();
      }
      identifyFlowLog("camera_opened", {
        screen: "CameraMain",
        cameraActive: !isCropRouteActive,
        hasDevice: !!device,
      });
      return () => {
        const topRoute =
          navigation.getState().routes[navigation.getState().index];
        setTorchOn(false);
        if (topRoute?.name === "IdentifyImageCrop") {
          identifyFlowLog("camera_unmounted_for_crop_host");
          return;
        }
        setIsCameraActive(false);
        setShouldRenderCamera(false);
      };
    }, [device, isCropRouteActive, navigation, restoreCameraSession])
  );

  /**
   * transparentModal keeps CameraMain focused on iOS — useFocusEffect alone won't
   * restore VisionCamera after crop cancel. Watch crop route + re-mount on pop.
   */
  useEffect(() => {
    if (isCropRouteActive || pendingCropNavigationRef.current) {
      if (isCropRouteActive) {
        pendingCropNavigationRef.current = false;
      }
      pauseCameraForCrop();
      return;
    }
    if (!isFocused) return;
    restoreCameraSession();
  }, [isCropRouteActive, isFocused, pauseCameraForCrop, restoreCameraSession]);

  // After permission is granted, show tips once (if not disabled) — not during multi-photo add.
  useEffect(() => {
    if (!hasPermission) return;
    if (hasShownTipsRef.current) return;
    if (selectedImages.length > 0 || isAddingAnotherPhoto) return;
    hasShownTipsRef.current = true;
    (async () => {
      try {
        const hasSeen = await AsyncStorage.getItem(HAS_SEEN_CAMERA_TIPS_KEY);
        if (hasSeen !== "true") {
          // Mark as seen on first display so it only appears once per install.
          await AsyncStorage.setItem(HAS_SEEN_CAMERA_TIPS_KEY, "true");
          setShowTipsModal(true);
        }
      } catch {
        setShowTipsModal(true);
      }
    })();
  }, [hasPermission, isAddingAnotherPhoto, selectedImages.length]);

  const photoScreenEnterTimeRef = useRef(0);
  useFocusEffect(
    useCallback(() => {
      void syncPermission();
    }, [syncPermission])
  );

  useFocusEffect(
    useCallback(() => {
      photoScreenEnterTimeRef.current = Date.now();
      analyticsService.logEvent(EVENTS.screen_view, {
        screen_name: "camera_main",
        source: "identify",
      });
      analyticsService.logEvent(EVENTS.identify_click, {
        source: "camera_main",
      });
      return () => {
        const durationSeconds = Math.round(
          (Date.now() - photoScreenEnterTimeRef.current) / 1000
        );
        if (durationSeconds > 0) {
          analyticsService.logEvent(EVENTS.photo_screen, {
            time_spent: String(durationSeconds),
          });
        }
      };
    }, [])
  );

  // Camera opened (when permission + device ready)
  useEffect(() => {
    if (hasPermission && isCameraReady && device) {
      analyticsService.logEvent(EVENTS.identify_camera_opened);
    }
  }, [hasPermission, isCameraReady, device]);

  const isCameraSessionActive =
    hasPermission &&
    !showTipsModal &&
    !showUpgradeSheet &&
    !isNativeDialogActive &&
    !isLocationPermissionFlowActive &&
    !showIdentifyReview &&
    screenFocused &&
    !isCropRouteActive &&
    isAppActive &&
    isCameraActive &&
    shouldRenderCamera;

  const showCameraHardware =
    hasPermission &&
    shouldRenderCamera &&
    !isCropRouteActive &&
    !!device &&
    !showUpgradeSheet &&
    !showCameraPermissionInline &&
    !showTipsModal &&
    !showIdentifyReview;

  // Recover inline permission UI if the OS denied access but state was not applied.
  useEffect(() => {
    if (
      !permissionChecked ||
      hasPermission ||
      cameraPermissionInline ||
      isNativeDialogActive
    ) {
      return;
    }
    void syncPermissionFromOs();
  }, [
    cameraPermissionInline,
    hasPermission,
    isNativeDialogActive,
    permissionChecked,
    syncPermissionFromOs,
  ]);

  useEffect(() => {
    if (!__DEV__) return;
    identifyFlowLog("camera_session_state", {
      isCameraSessionActive,
      isFocused,
      isCropRouteActive,
      isCameraActive,
      shouldRenderCamera,
      isAppActive,
    });
  }, [
    isAppActive,
    isCameraActive,
    isCameraSessionActive,
    isCropRouteActive,
    isFocused,
    shouldRenderCamera,
  ]);

  const canUseCameraHardware =
    !!device && isCameraSessionActive && isCameraReady && !isCapturing;

  // Reset ready when session pauses; fallback-enable if onStarted never fires after resume.
  useEffect(() => {
    if (!isCameraSessionActive) {
      setIsCameraReady(false);
      isCameraReadyRef.current = false;
      return;
    }
    let cancelled = false;
    let fallbackTimer: ReturnType<typeof setTimeout> | null = null;
    const armFallback = (delayMs: number) => {
      if (fallbackTimer) clearTimeout(fallbackTimer);
      fallbackTimer = setTimeout(() => {
        if (cancelled) return;
        setIsCameraReady(true);
        isCameraReadyRef.current = true;
      }, delayMs);
    };
    armFallback(700);
    void isEmulatorDevice().then((emulator) => {
      if (cancelled || !emulator) return;
      armFallback(400);
    });
    return () => {
      cancelled = true;
      if (fallbackTimer) clearTimeout(fallbackTimer);
    };
  }, [isCameraSessionActive, cameraFacing]);

  // Resolve camera permission on focus — inline recovery on CameraMain.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      const startEntryFlow = async () => {
        if (!device) {
          void syncPermissionFromOs();
          if (!cancelled) setTipsCheckDone(true);
          return;
        }

        try {
          if (isExternalCameraReturn) {
            const current = await checkCameraPermission();
            if (current.granted) {
              await syncPermissionFromOs();
              if (!cancelled) setTipsCheckDone(true);
              return;
            }
          }
          await runEntryPermissionFlow();
        } catch {
          await syncPermissionFromOs();
        } finally {
          setTipsCheckDone(true);
        }
      };

      void startEntryFlow();

      return () => {
        cancelled = true;
        resetEntryFlow();
      };
    }, [
      device,
      isExternalCameraReturn,
      resetEntryFlow,
      runEntryPermissionFlow,
      syncPermissionFromOs,
    ])
  );

  useFocusEffect(
    useCallback(() => {
      setScreenFocused(true);
      syncExternalCameraSessionOnFocus(navigation, route.params);
      return () => {
        setScreenFocused(false);
        const state = navigation.getState();
        const topRoute = state.routes[state.index]?.name;
        if (
          !CAMERA_FLOW_CHILD_ROUTES.includes(
            topRoute as (typeof CAMERA_FLOW_CHILD_ROUTES)[number]
          )
        ) {
          useIdentificationEntryStore
            .getState()
            .setExternalCameraReturnTarget(null);
        }
      };
    }, [navigation, route.params])
  );

  // Re-check camera permission when app becomes active (returning from Settings).
  useEffect(() => {
    const sub = AppState.addEventListener("change", async (state) => {
      setIsAppActive(state === "active");
      if (state !== "active") {
        setTorchOn(false);
        return;
      }
      await syncPermissionFromOs();
    });
    return () => sub.remove();
  }, [syncPermissionFromOs]);

  // Hint tooltip after short delay — only on empty first capture.
  useEffect(() => {
    if (selectedImages.length > 0 || isAddingAnotherPhoto) {
      setShowHint(false);
      return;
    }
    const t1 = setTimeout(() => setShowHint(true), 900);
    const t2 = setTimeout(() => setShowHint(false), 4200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [selectedImages.length, isAddingAnotherPhoto]);

  // Back handling for overlays + selection state.
  const handleBackPress = useCallback(() => {
    if (showTipsModal) {
      setShowTipsModal(false);
      return true;
    }
    if (showUpgradeSheet) {
      setShowUpgradeSheet(false);
      return true;
    }
    if (showChangeLocationSheet) {
      setShowChangeLocationSheet(false);
      return true;
    }
    if (showCustomPopup) {
      setShowCustomPopup(false);
      return true;
    }
    if (showManagePopup) {
      setShowManagePopup(false);
      return true;
    }
    if (isAddingAnotherPhotoRef.current && selectedImagesRef.current.length) {
      setIsAddingAnotherPhoto(false);
      return true;
    }
    if (selectedImagesRef.current.length) {
      setSelectedImages([]);
      setIsAddingAnotherPhoto(false);
      return true;
    }
    if (navigation.canGoBack()) {
      navigation.goBack();
      return true;
    }
    useIdentificationEntryStore.getState().setSuppressFtueAutoNavigation(true);
    navigation.getParent()?.navigate("Home", { screen: "HomeMain" });
    return true;
  }, [
    navigation,
    showTipsModal,
    showUpgradeSheet,
    showChangeLocationSheet,
    showCustomPopup,
    showManagePopup,
    setShowChangeLocationSheet,
    setShowCustomPopup,
    setShowManagePopup,
  ]);

  useFocusEffect(
    useCallback(() => {
      const onBack = () => handleBackPress();
      const sub = BackHandler.addEventListener("hardwareBackPress", onBack);
      return () => sub.remove();
    }, [handleBackPress])
  );

  useFocusEffect(
    useCallback(() => {
      void refreshPhotoLimit();
    }, [refreshPhotoLimit])
  );

  // Identify flow supports up to two preview images before submit.

  const openGallery = useCallback(() => {
    if (isNativeDialogActive) return;

    analyticsService.logEvent(EVENTS.identify_photo, { source: "gallery" });

    if (selectedImagesRef.current.length >= MAX_CAMERA_IDENTIFY_IMAGES) {
      setWarning(strings.camera.limits.maxPhotosSelected);
      setTimeout(() => setWarning(null), 3000);
      return;
    }

    navigation.navigate(
      "GalleryPicker",
      buildGalleryPickerParams(cameraReturnTarget, {
        feedDraft: route.params?.feedDraft,
        currentImageCount: selectedImagesRef.current.length,
      })
    );
  }, [
    cameraReturnTarget,
    isNativeDialogActive,
    navigation,
    route.params?.feedDraft,
    strings.camera.limits.maxPhotosSelected,
  ]);

  const capture = useCallback(async () => {
    if (isCapturingRef.current) {
      identifyFlowLog("shutter_blocked", { reason: "already_capturing" });
      return;
    }

    if (!hasPermission) return;

    if (!cameraRef.current) {
      identifyFlowLog("shutter_blocked", {
        hasRef: false,
        isCapturing: isCapturingRef.current,
      });
      setWarning("Camera is still starting. Wait a moment and try again.");
      setTimeout(() => setWarning(null), 3000);
      return;
    }
    if (!canUseCameraHardware) {
      identifyFlowLog("shutter_blocked_not_ready", {
        hasDevice: !!device,
        isCameraSessionActive,
        isCameraReady,
        isCapturing,
      });
      setWarning("Camera is still starting. Wait a moment and try again.");
      setTimeout(() => setWarning(null), 3000);
      return;
    }

    if (selectedImagesRef.current.length >= MAX_CAMERA_IDENTIFY_IMAGES) {
      setWarning(strings.camera.limits.maxPhotosSelected);
      setTimeout(() => setWarning(null), 3000);
      return;
    }

    isCapturingRef.current = true;
    setIsCapturing(true);
    const watchdog = setTimeout(() => {
      isCapturingRef.current = false;
      setIsCapturing(false);
    }, 45000);
    try {
      identifyFlowLog("shutter_pressed");
      analyticsService.logEvent(EVENTS.photo_clicked);
      analyticsService.logEvent(EVENTS.identify_photo, { source: "camera" });
      analyticsService.logEvent(EVENTS.identify_image_captured);

      identifyFlowLog("takePhoto_started");
      const photo: PhotoFile = await Promise.race([
        cameraRef.current.takePhoto({
          flash: torchOn ? "on" : "off",
          enableShutterSound: false,
        }),
        new Promise<never>((_, reject) => {
          setTimeout(
            () => reject(new Error("takePhoto_timeout")),
            TAKE_PHOTO_TIMEOUT_MS
          );
        }),
      ]);
      if (!photo.path) {
        identifyFlowLog("takePhoto_failed", { reason: "empty_path" });
        setWarning("Failed to capture photo. Please try again.");
        setTimeout(() => setWarning(null), 3000);
        return;
      }
      identifyFlowLog("takePhoto_success", {
        pathPrefix: photo.path.slice(0, 32),
      });

      const rawPath = photo.path.startsWith("file://")
        ? photo.path
        : `file://${photo.path}`;
      const normalized = normalizeImageUriForCrop(rawPath);
      if (!normalized) {
        identifyFlowLog("capture_invalid_uri");
        setWarning("Failed to process photo. Please try again.");
        setTimeout(() => setWarning(null), 3000);
        return;
      }

      let uriForCrop = normalized;
      identifyFlowLog("camera_release_before_crop");
      setCapturePreviewUri(normalized);
      setIsCameraActive(false);
      setShouldRenderCamera(false);

      if (Platform.OS === "ios") {
        const [stable] = await Promise.all([
          copyCaptureToStableCache(normalized),
          releaseVisionCameraForNativeUi(),
        ]);
        if (stable) {
          uriForCrop = stable;
          identifyFlowLog("capture_stable_copy_ok", {
            pathPrefix: stable.slice(0, 32),
          });
        }
      } else {
        await releaseVisionCameraForNativeUi();
      }

      identifyFlowLog("capture_navigate_crop_host", {
        pathPrefix: uriForCrop.slice(0, 32),
      });
      pendingCropNavigationRef.current = true;
      const activeExternal = resolveActiveExternalReturnTarget(route.params);
      const returnTarget = activeExternal ?? "camera";
      navigation.navigate("IdentifyImageCrop", {
        imageUri: uriForCrop,
        returnTarget,
        ...externalReturnFlagsForTarget(activeExternal),
        feedDraft: route.params?.feedDraft,
        cameraAlreadyReleased: true,
      });
    } catch (error) {
      identifyFlowLog("capture_error", {
        message: String((error as Error)?.message ?? error),
      });
      console.error("Error capturing photo:", error);
      setWarning("Failed to capture photo. Please try again.");
      setTimeout(() => setWarning(null), 3000);
      setCapturePreviewUri(null);
      setIsCameraActive(true);
      setShouldRenderCamera(true);
    } finally {
      clearTimeout(watchdog);
      isCapturingRef.current = false;
      setIsCapturing(false);
    }
  }, [
    canUseCameraHardware,
    device,
    isCameraReady,
    isCameraSessionActive,
    isCapturing,
    hasPermission,
    navigation,
    route.params,
    torchOn,
    strings.camera.limits.maxPhotosSelected,
  ]);

  const removePhoto = (idx: number) => {
    setSelectedImages((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      if (next.length === 0) {
        setIsAddingAnotherPhoto(false);
      }
      return next;
    });
  };

  const handleAddAnotherPhoto = useCallback(() => {
    if (selectedImagesRef.current.length >= MAX_CAMERA_IDENTIFY_IMAGES) {
      setWarning(strings.camera.limits.maxPhotosSelected);
      setTimeout(() => setWarning(null), 3000);
      return;
    }
    const galleryOnly = !device || !hasPermission;
    if (galleryOnly) {
      void openGallery();
      return;
    }
    restoreCameraSession();
    setShowHint(false);
    setShowTipsModal(false);
    setIsAddingAnotherPhoto(true);
  }, [
    device,
    hasPermission,
    openGallery,
    restoreCameraSession,
    strings.camera.limits.maxPhotosSelected,
  ]);

  const submit = async () => {
    const imgs = selectedImagesRef.current;
    if (!imgs.length) return;
    identifyFlowLog("submit_started", { count: imgs.length });
    await submitProcessed(imgs);
    identifyFlowLog("submit_finished");
  };

  const handleTipsClose = () => setShowTipsModal(false);
  const handleDontShowTipsAgain = async () => {
    try {
      await AsyncStorage.setItem(HAS_SEEN_CAMERA_TIPS_KEY, "true");
    } catch {
      // ignore
    } finally {
      setShowTipsModal(false);
    }
  };

  // Wait for permission check before choosing camera vs gallery-only UI.
  if (!isCameraUiReady) {
    return (
      <View
        style={[
          cameraStyles.cameraContainer,
          { backgroundColor: CAMERA_BG_FALLBACK },
        ]}
      />
    );
  }

  // No camera hardware (simulator) → gallery upload path.
  const noDeviceMode = permissionChecked && !device;
  const reviewTopInset = insets.top + 120;

  if (noDeviceMode) {
    if (showIdentifyReview) {
      return (
        <View
          style={[
            cameraStyles.cameraContainer,
            { backgroundColor: APP_COLORS.surfaceDark },
          ]}
        >
          <TouchableOpacity
            onPress={handleBackPress}
            style={[
              styles.topNavButton,
              styles.topNavButtonLeft,
              styles.topNavButtonBack,
              { top: insets.top + 12 },
            ]}
            activeOpacity={0.8}
            hitSlop={HIT_SLOP.CLOSE}
          >
            <NavBackIcon color="#FFFFFF" size={CAPTURE_TOP_ICON_SIZE} />
          </TouchableOpacity>

          <View style={[styles.locationBannerWrap, { top: insets.top + 68 }]}>
            <IdentificationLocationBanner
              variant="camera"
              permissionGranted={shouldShowLocationBannerAsGranted(
                locationPermissionGranted,
                location
              )}
              locationLabel={locationLabel}
              onToggleLocation={handleLocationToggle}
              onPressLocation={() => openCustomLocationSheet()}
            />
          </View>

          <CameraIdentifyReview
            images={selectedImages}
            topInset={reviewTopInset}
            addAnotherLabel={strings.camera.buttons.addAnotherPhoto}
            identifyLabel={strings.camera.buttons.identifyBird}
            imageCounterLabel={formatImageCounter}
            submitToastLabel={formatSubmitToast}
            isProcessing={isProcessing}
            onRemove={removePhoto}
            onAddAnother={handleAddAnotherPhoto}
            onIdentify={submit}
          />

          {warning && <CameraWarnings text={warning} />}
        </View>
      );
    }

    if (selectedImages.length >= MAX_CAMERA_IDENTIFY_IMAGES) {
      return (
        <View
          style={[
            cameraStyles.cameraContainer,
            { backgroundColor: APP_COLORS.surfaceDark },
          ]}
        >
          <TouchableOpacity
            onPress={handleBackPress}
            style={[
              styles.topNavButton,
              styles.topNavButtonLeft,
              styles.topNavButtonBack,
              { top: insets.top + 12 },
            ]}
            activeOpacity={0.8}
            hitSlop={HIT_SLOP.CLOSE}
          >
            <NavBackIcon color="#FFFFFF" size={CAPTURE_TOP_ICON_SIZE} />
          </TouchableOpacity>

          <View style={[styles.locationBannerWrap, { top: insets.top + 68 }]}>
            <IdentificationLocationBanner
              variant="camera"
              permissionGranted={shouldShowLocationBannerAsGranted(
                locationPermissionGranted,
                location
              )}
              locationLabel={locationLabel}
              onToggleLocation={handleLocationToggle}
              onPressLocation={() => openCustomLocationSheet()}
            />
          </View>

          <View style={styles.galleryOnlyReadyContent}>
            <CameraImageSlots
              images={selectedImages}
              maxImages={MAX_CAMERA_IDENTIFY_IMAGES}
              onRemove={removePhoto}
            />
            <Text
              variant="body"
              size="small"
              style={styles.captureImageCounter}
            >
              {formatImageCounter(
                selectedImages.length,
                MAX_CAMERA_IDENTIFY_IMAGES
              )}
            </Text>
            <TouchableOpacity
              onPress={submit}
              activeOpacity={0.85}
              disabled={isProcessing}
              style={[
                styles.submitBtn,
                {
                  backgroundColor: APP_COLORS.createButtonFg,
                  borderRadius: theme.radius.lg,
                  opacity: isProcessing ? 0.7 : 1,
                },
              ]}
            >
              <Text
                variant="body"
                size="medium"
                weight="semibold"
                style={{ color: APP_COLORS.modalTextOnPrimary }}
              >
                {isProcessing
                  ? "Preparing…"
                  : strings.camera.buttons.identifyBird}
              </Text>
            </TouchableOpacity>
          </View>

          {warning && <CameraWarnings text={warning} />}
        </View>
      );
    }

    return (
      <AppImageBackground
        source={identifyBackground}
        style={[
          cameraStyles.cameraContainer,
          styles.noDeviceContainer,
          { backgroundColor: CAMERA_BG_FALLBACK },
        ]}
        imageStyle={styles.cameraBgImage}
        resizeMode="cover"
      >
        <TouchableOpacity
          onPress={handleBackPress}
          style={[
            styles.topNavButton,
            styles.topNavButtonLeft,
            styles.topNavButtonBack,
            {
              top: insets.top + 12,
            },
          ]}
          activeOpacity={0.8}
          hitSlop={HIT_SLOP.CLOSE}
        >
          <NavBackIcon color="#FFFFFF" size={CAPTURE_TOP_ICON_SIZE} />
        </TouchableOpacity>

        <View style={styles.noDeviceContent}>
          <MaterialIcons
            name="videocam-off"
            size={64}
            color={theme.colors.textTertiary}
          />
          <Text
            variant="body"
            size="medium"
            color="textSecondary"
            style={styles.noDeviceTitle}
          >
            {hasPermission ? "Camera not available" : "Camera access needed"}
          </Text>
          <Text
            variant="body"
            size="small"
            color="textTertiary"
            style={styles.noDeviceSubtitle}
          >
            {hasPermission
              ? "This device has no camera. Upload an image from your gallery to identify a bird."
              : "Turn on camera access to take photos, or upload an image from your gallery to identify a bird."}
          </Text>
          <TouchableOpacity
            onPress={openGallery}
            style={[
              styles.galleryCta,
              { backgroundColor: theme.colors.primary },
            ]}
            activeOpacity={0.8}
          >
            <AppImage
              source={Images.iconfixUpload}
              style={[styles.controlIconWhite]}
              resizeMode="contain"
              preferRNImage
            />
            <Text
              variant="body"
              size="medium"
              weight="semibold"
              color="surface"
            >
              Upload image
            </Text>
          </TouchableOpacity>
        </View>

        {warning && <CameraWarnings text={warning} />}
      </AppImageBackground>
    );
  }

  return (
    <View
      style={[
        cameraStyles.cameraContainer,
        {
          backgroundColor: showUpgradeSheet
            ? theme.colors.background
            : CAMERA_BG_FALLBACK,
        },
      ]}
    >
      {!showUpgradeSheet && (
        <StatusBar
          barStyle="light-content"
          translucent
          backgroundColor="transparent"
        />
      )}

      {!showUpgradeSheet && (
        <>
          {showCameraHardware ? (
            <Camera
              ref={cameraRef}
              style={styles.cameraLayer}
              device={device}
              torch={torchOn ? "on" : "off"}
              zoom={cameraZoom}
              isActive={isCameraSessionActive}
              photo={true}
              enableZoomGesture={true}
              onInitialized={() => {
                if (!isFocused || isCropRouteActive) return;
                isCameraReadyRef.current = true;
                setIsCameraReady(true);
                identifyFlowLog("camera_ready", { source: "onInitialized" });
              }}
              onStarted={() => {
                if (!isFocused || isCropRouteActive) return;
                isCameraReadyRef.current = true;
                setIsCameraReady(true);
                identifyFlowLog("camera_ready", { source: "onStarted" });
              }}
              onError={(err) => {
                console.error("Camera error:", err);
                setWarning(
                  "Camera failed to start. Try again or upload a photo."
                );
                setTimeout(() => setWarning(null), 3500);
              }}
            />
          ) : capturePreviewUri ? (
            <AppImage
              source={{ uri: capturePreviewUri }}
              style={styles.cameraLayer}
              resizeMode="cover"
              preferRNImage
            />
          ) : null}

          {/* Controls above the native Camera view so shutter taps aren't swallowed. */}
          <View style={styles.controlsLayer} pointerEvents="box-none">
            {!showIdentifyReview && hasPermission && (
              <CameraCaptureOverlay layout={captureFrameLayout} />
            )}

            {/* Top-left: back — circular bg matches flash control */}
            <TouchableOpacity
              onPress={handleBackPress}
              style={[
                styles.topNavButton,
                styles.topNavButtonLeft,
                styles.topNavButtonBack,
                showIdentifyReview && styles.topNavButtonRaised,
                {
                  top: insets.top + 12,
                },
              ]}
              activeOpacity={0.8}
              hitSlop={HIT_SLOP.CLOSE}
            >
              <NavBackIcon color="#FFFFFF" size={CAPTURE_TOP_ICON_SIZE} />
            </TouchableOpacity>

            {/* Top-right: sound identify */}
            {!showIdentifyReview && !isCameraPermissionGateActive && (
              <TouchableOpacity
                onPress={() => {
                  const startSound =
                    useIdentificationEntryStore.getState()
                      .startSoundEntryHandler;
                  if (startSound) {
                    startSound();
                    return;
                  }
                  navigation.navigate("SoundIdentify");
                }}
                style={[
                  styles.topNavButton,
                  styles.topNavButtonRight,
                  styles.topNavButtonBack,
                  {
                    top: insets.top + 12,
                    right: device?.hasTorch ? 68 : 16,
                  },
                ]}
                activeOpacity={0.8}
                hitSlop={HIT_SLOP.CLOSE}
                accessibilityRole="button"
                accessibilityLabel="Identify by sound"
              >
                <MaterialIcons name="mic" size={26} color="#FFFFFF" />
              </TouchableOpacity>
            )}

            {/* Top-right: flash (torch) — same 44px circle + 26px icon in both states */}
            {!showIdentifyReview &&
              !isCameraPermissionGateActive &&
              device?.hasTorch && (
                <TouchableOpacity
                  onPress={() => setTorchOn((prev) => !prev)}
                  style={[
                    styles.topNavButton,
                    styles.topNavButtonRight,
                    styles.topNavButtonBack,
                    {
                      top: insets.top + 12,
                    },
                  ]}
                  activeOpacity={0.8}
                  hitSlop={HIT_SLOP.CLOSE}
                >
                  <AppImage
                    source={
                      torchOn ? Images.iconfixFlash : Images.iconfixFlashOff
                    }
                    style={styles.backNavIcon}
                    resizeMode="contain"
                    preferRNImage
                  />
                </TouchableOpacity>
              )}

            {warning && <CameraWarnings text={warning} />}

            {!isCameraPermissionGateActive ? (
              <View
                onLayout={(event) =>
                  setLocationBannerHeight(event.nativeEvent.layout.height)
                }
                style={[
                  styles.locationBannerWrap,
                  showIdentifyReview && styles.locationBannerWrapRaised,
                  { top: insets.top + 68 },
                ]}
              >
                <IdentificationLocationBanner
                  variant="camera"
                  permissionGranted={shouldShowLocationBannerAsGranted(
                    locationPermissionGranted,
                    location
                  )}
                  locationLabel={locationLabel}
                  onToggleLocation={handleLocationToggle}
                  onPressLocation={() => openCustomLocationSheet()}
                />
              </View>
            ) : null}

            {showCameraPermissionInline ? (
              <View
                style={[
                  styles.cameraPermissionInlineHost,
                  {
                    top: insets.top + 120,
                    bottom: Math.max(insets.bottom, 8) + 76,
                  },
                ]}
                pointerEvents="box-none"
              >
                <CameraPermissionInlineState
                  variant={cameraPermissionInline!}
                  loading={cameraPermissionLoading}
                  onAction={() => void handleCameraPermissionAction()}
                />
              </View>
            ) : null}

            {showIdentifyReview ? (
              <CameraIdentifyReview
                images={selectedImages}
                topInset={reviewTopInset}
                addAnotherLabel={strings.camera.buttons.addAnotherPhoto}
                identifyLabel={strings.camera.buttons.identifyBird}
                imageCounterLabel={formatImageCounter}
                submitToastLabel={formatSubmitToast}
                isProcessing={isProcessing}
                onRemove={removePhoto}
                onAddAnother={handleAddAnotherPhoto}
                onIdentify={submit}
              />
            ) : null}

            {/* Hint tooltip */}
            {!showIdentifyReview &&
              showHint &&
              !showCameraPermissionInline &&
              !isAddingAnotherPhoto &&
              selectedImages.length === 0 && (
                <View
                  style={[
                    styles.hintPill,
                    { backgroundColor: theme.colors.surface + "E6" },
                  ]}
                >
                  <AppImage
                    source={Images.informationCircle}
                    style={[
                      styles.controlIconWhite,
                      {
                        width: 16,
                        height: 16,
                      },
                    ]}
                    resizeMode="contain"
                  />
                  <Text
                    variant="body"
                    size="small"
                    color="textSecondary"
                    style={{ flex: 1 }}
                  >
                    Keep the bird centered, well-lit, and in focus.
                  </Text>
                </View>
              )}

            {/* Two-image slots, lifetime scan banner, and zoom — below viewfinder (Figma) */}
            {!showIdentifyReview && !isCameraPermissionGateActive && (
              <View
                onLayout={(event) =>
                  setCaptureControlsHeight(event.nativeEvent.layout.height)
                }
                style={[
                  styles.captureContentColumn,
                  {
                    top: captureContentLayout.top,
                  },
                ]}
                pointerEvents="box-none"
              >
                <CameraImageSlots
                  images={selectedImages}
                  maxImages={MAX_CAMERA_IDENTIFY_IMAGES}
                  onRemove={removePhoto}
                />

                {selectedImages.length > 0 ? (
                  <Text
                    variant="body"
                    size="small"
                    style={styles.captureImageCounter}
                  >
                    {formatImageCounter(
                      selectedImages.length,
                      MAX_CAMERA_IDENTIFY_IMAGES
                    )}
                  </Text>
                ) : null}

                {!isPremium && (
                  <CameraDailyScanBanner
                    remaining={photoLimit.remaining}
                    dailyLimit={photoLimit.dailyLimit}
                    resetLabel={photoLimit.resetLabel}
                    style={styles.dailyScanBanner}
                  />
                )}

                <View style={styles.zoomSliderInline} pointerEvents="box-none">
                  <CameraZoomControls
                    zoom={zoomUi}
                    onZoomChange={setZoomUi}
                    disabled={!isCameraReady}
                  />
                </View>

                {selectedImages.length >= MAX_CAMERA_IDENTIFY_IMAGES ? (
                  <TouchableOpacity
                    onPress={submit}
                    activeOpacity={0.85}
                    disabled={isProcessing}
                    style={[
                      styles.submitBtn,
                      {
                        backgroundColor: APP_COLORS.createButtonFg,
                        borderRadius: theme.radius.lg,
                        opacity: isProcessing ? 0.7 : 1,
                        marginTop: SUBMIT_BELOW_ZOOM_GAP,
                      },
                    ]}
                  >
                    {isProcessing ? (
                      <Text
                        variant="body"
                        size="medium"
                        weight="semibold"
                        style={{ color: APP_COLORS.modalTextOnPrimary }}
                      >
                        Preparing…
                      </Text>
                    ) : (
                      <Text
                        variant="body"
                        size="medium"
                        weight="semibold"
                        style={{ color: APP_COLORS.modalTextOnPrimary }}
                      >
                        {strings.camera.buttons.identifyBird}
                      </Text>
                    )}
                  </TouchableOpacity>
                ) : null}
              </View>
            )}

            {/* Bottom controls: Gallery (left) | Capture (center) | Tips (right) */}
            {!showIdentifyReview && !isCameraPermissionGateActive && (
              <View
                onLayout={(event) =>
                  setBottomControlsHeight(event.nativeEvent.layout.height)
                }
                style={[
                  styles.bottomBar,
                  {
                    paddingBottom: Math.max(8, insets.bottom),
                  },
                ]}
              >
                <View style={styles.controls}>
                  <TouchableOpacity
                    onPress={openGallery}
                    style={[
                      styles.sideIconOnly,
                      isNativeDialogActive && styles.sideIconDisabled,
                    ]}
                    activeOpacity={0.8}
                    disabled={isNativeDialogActive}
                    hitSlop={HIT_SLOP.CLOSE}
                  >
                    <AppImage
                      source={Images.iconfixUpload}
                      style={styles.uploadSideIcon}
                      resizeMode="contain"
                      preferRNImage
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.captureOuter,
                      {
                        opacity:
                          isCapturing || !canUseCameraHardware ? 0.45 : 1,
                      },
                    ]}
                    onPress={capture}
                    activeOpacity={0.8}
                    disabled={isCapturing || !canUseCameraHardware}
                    accessibilityRole="button"
                    accessibilityLabel="Capture photo"
                    accessibilityState={{
                      disabled: isCapturing || !canUseCameraHardware,
                    }}
                  >
                    <View style={styles.captureInnerRing}>
                      <View style={styles.captureInnerFill} />
                    </View>
                  </TouchableOpacity>

                  {isAddingAnotherPhoto || selectedImages.length > 0 ? (
                    <View style={styles.sideBtn} />
                  ) : (
                    <TouchableOpacity
                      onPress={() => setShowTipsModal(true)}
                      style={styles.sideBtn}
                      activeOpacity={0.8}
                      hitSlop={HIT_SLOP.CLOSE}
                      accessibilityRole="button"
                      accessibilityLabel="Photo tips"
                    >
                      <AppImage
                        source={Images.informationCircle}
                        style={styles.controlIconWhite}
                        resizeMode="contain"
                      />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
          </View>
        </>
      )}

      <CameraTipsModal
        visible={showTipsModal}
        onClose={handleTipsClose}
        onDontShowAgain={handleDontShowTipsAgain}
        overlay
      />

      <LimitReachedBottomSheet
        visible={showUpgradeSheet}
        onClose={() => setShowUpgradeSheet(false)}
        onUpgrade={() => {
          analyticsService.logEvent(EVENTS.identification_limit_upgrade_click, {
            source: "camera_main",
          });
          setShowUpgradeSheet(false);
          navigateToSubscriptionMain();
        }}
        limitType="identification"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  /** Native camera fills the screen; controls sit in a separate elevated layer. */
  cameraLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  controlsLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    elevation: 10,
  },
  /** Image layer: cover, centered (50%), no-repeat — matches CSS url() 50% / cover no-repeat */
  cameraBgImage: {
    width: "100%",
    height: "100%",
  },
  topNavButton: {
    position: "absolute",
    width: CAPTURE_TOP_ICON_BUTTON_SIZE,
    height: CAPTURE_TOP_ICON_BUTTON_SIZE,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  topNavButtonRaised: {
    zIndex: 30,
    elevation: 30,
  },
  topNavButtonLeft: {
    left: 20,
  },
  topNavButtonRight: {
    right: 20,
  },
  topNavButtonBack: {
    borderRadius: CAPTURE_TOP_ICON_BUTTON_SIZE / 2,
    backgroundColor: APP_COLORS.blurOverlayWhite10,
  },
  backNavIcon: {
    width: CAPTURE_TOP_ICON_SIZE,
    height: CAPTURE_TOP_ICON_SIZE,
    tintColor: "#FFFFFF",
  },
  locationBannerWrap: {
    position: "absolute",
    left: 20,
    right: 20,
    zIndex: 11,
  },
  locationBannerWrapRaised: {
    zIndex: 30,
    elevation: 30,
  },
  captureContentColumn: {
    position: "absolute",
    left: 20,
    right: 20,
    zIndex: 11,
    alignItems: "center",
    gap: CAPTURE_CONTENT_GAP,
  },
  dailyScanBanner: {
    marginTop: 0,
  },
  captureImageCounter: {
    color: "#888888",
    textAlign: "center",
  },
  galleryOnlyReadyContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 20,
    paddingTop: 120,
  },
  zoomSliderInline: {
    width: "100%",
    alignItems: "center",
    paddingHorizontal: 0,
  },
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingTop: 16,
    zIndex: 20,
    elevation: 20,
  },
  controls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  sideBtn: {
    width: CAPTURE_SIDE_BUTTON_SIZE,
    height: CAPTURE_SIDE_BUTTON_SIZE,
    borderRadius: CAPTURE_SIDE_BUTTON_SIZE / 2,
    backgroundColor: APP_COLORS.blurOverlayWhite10,
    justifyContent: "center",
    alignItems: "center",
  },
  /** Upload asset includes its own circular background — no extra sideBtn fill */
  sideIconOnly: {
    width: CAPTURE_SIDE_BUTTON_SIZE,
    height: CAPTURE_SIDE_BUTTON_SIZE,
    justifyContent: "center",
    alignItems: "center",
  },
  sideIconDisabled: {
    opacity: 0.45,
  },
  cameraPermissionInlineHost: {
    position: "absolute",
    left: 20,
    right: 20,
    zIndex: 25,
    elevation: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  uploadSideIcon: {
    width: CAPTURE_SIDE_BUTTON_SIZE,
    height: CAPTURE_SIDE_BUTTON_SIZE,
  },
  captureOuter: {
    width: CAPTURE_SHUTTER_OUTER_SIZE,
    height: CAPTURE_SHUTTER_OUTER_SIZE,
    justifyContent: "center",
    alignItems: "center",
  },
  captureInnerRing: {
    width: CAPTURE_SHUTTER_OUTER_SIZE,
    height: CAPTURE_SHUTTER_OUTER_SIZE,
    borderRadius: CAPTURE_SHUTTER_OUTER_SIZE / 2,
    borderWidth: CAPTURE_SHUTTER_RING_BORDER,
    borderColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  captureInnerFill: {
    width: CAPTURE_SHUTTER_INNER_SIZE,
    height: CAPTURE_SHUTTER_INNER_SIZE,
    borderRadius: CAPTURE_SHUTTER_INNER_SIZE / 2,
    backgroundColor: "#FFFFFF",
  },
  controlIconWhite: {
    width: CAPTURE_SIDE_ICON_SIZE,
    height: CAPTURE_SIDE_ICON_SIZE,
    tintColor: "#FFFFFF",
  },
  noDeviceContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noDeviceContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    maxWidth: 320,
  },
  noDeviceTitle: {
    marginTop: 16,
    textAlign: "center",
  },
  noDeviceSubtitle: {
    marginTop: 8,
    textAlign: "center",
  },
  galleryCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 28,
    marginTop: 24,
  },
  galleryCtaSecondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    marginTop: 16,
  },
  /** Preview + submit for "Camera not available" only; does not affect camera-available UI */
  noDevicePreviewSection: {
    marginTop: 24,
    width: "100%",
    alignItems: "center",
  },
  hintPill: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 150,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    zIndex: 11,
  },
  thumbsRow: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
    marginBottom: 12,
  },
  thumbWrap: {
    width: 78,
    height: 78,
    overflow: "visible",
    zIndex: 20,
  },
  thumbImageClip: {
    width: 78,
    height: 78,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
  },
  thumbEmpty: {
    justifyContent: "center",
    alignItems: "center",
  },
  thumbImage: {
    width: "100%",
    height: "100%",
  },
  thumbRemove: {
    position: "absolute",
    top: -8,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 30,
    elevation: 30,
  },
  submitBtn: {
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    minWidth: 200,
  },
});
