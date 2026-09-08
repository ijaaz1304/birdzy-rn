/**
 * Gallery Picker Screen
 * iOS: PHPicker (react-native-image-picker) → review UI + location footer → crop → identify.
 * Android: system picker → review UI + location footer → crop → identify.
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useFocusEffect,
  useNavigation,
  useRoute,
  RouteProp,
} from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useTheme } from "../../../hooks/useTheme";
import { Text } from "../../../atoms";
import { CameraStackParamList } from "../../../navigation/types";
import {
  GalleryPickerFooter,
  GALLERY_FOOTER_RESERVE,
} from "../components/GalleryPickerFooter";
import { GalleryPickerAndroidReview } from "../components/GalleryPickerAndroidReview";
import { settleBeforeNativeCropper } from "../camera.utils";
import { openInteractiveCropper } from "../interactiveCrop";
import { CroppedImageObject } from "../cropImageAndReturnObject";
import { useGalleryPickerSelectionStore } from "../galleryPickerSelection.store";
import { identifyFlowLog } from "../identifyFlowLog";
import {
  returnGalleryCropToCamera,
  submitProcessedImageForIdentify,
} from "../identifyImageFlow";
import { pickAndroidGalleryImageForIdentify } from "../androidIdentifyGalleryFlow";
import { pickIosGalleryImageForIdentify } from "../iosIdentifyGalleryFlow";
import { resolveGalleryPhotoUri } from "../resolveGalleryPhotoUri";
import { resolveActiveExternalReturnTarget } from "../identifyCameraNavigation";
import { analyticsService } from "../../../services/analytics/analytics.service";
import { EVENTS } from "../../../services/analytics/analytics.events";
import { navigateToSubscriptionMain } from "../../../utils/navigation";
import { LimitReachedBottomSheet } from "../../../molecules/Modal";
import {
  useSubscriptionStore,
  selectIsPremium,
} from "../../../features/subscription/subscription.store";
import { showAlert } from "../../../store/alert.store";
import { useLocationPermissionUiStore } from "../locationPermissionUi.store";
import {
  openDeviceSettings,
} from "../../../services/permissions";
import { getGalleryPermissionUiCopy } from "../../../services/permissions/permissionUiCopy";
import { MAX_CAMERA_IDENTIFY_IMAGES } from "../utils/identificationLimitDisplay";
import { CAMERA_STRINGS } from "../../../config/strings/camera.strings";

type GalleryPickerRouteProp = RouteProp<CameraStackParamList, "GalleryPicker">;
type GalleryPickerNavigationProp = NativeStackNavigationProp<
  CameraStackParamList,
  "GalleryPicker"
>;

const isAndroid = Platform.OS === "android";

export const GalleryPickerScreen: React.FC = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<GalleryPickerNavigationProp>();
  const route = useRoute<GalleryPickerRouteProp>();
  const cameraReturnTarget = resolveActiveExternalReturnTarget(route.params);
  const returnImageToAskAI = cameraReturnTarget === "askAi";
  const returnImageToFeed = cameraReturnTarget === "feed";
  const returnImageToQuiz = cameraReturnTarget === "quiz";
  const feedDraft = route.params?.feedDraft;
  const currentImageCount = route.params?.currentImageCount ?? 0;
  const remainingSlots = Math.max(
    0,
    MAX_CAMERA_IDENTIFY_IMAGES - currentImageCount
  );

  const [submitting, setSubmitting] = useState(false);
  const [showUpgradeSheet, setShowUpgradeSheet] = useState(false);
  const [pickerLoading, setPickerLoading] = useState(true);

  const setSelected = useGalleryPickerSelectionStore((s) => s.setSelected);
  const setThumbUri = useGalleryPickerSelectionStore((s) => s.setThumbUri);
  const selectedPhoto = useGalleryPickerSelectionStore((s) => s.selected);

  const isPremium = useSubscriptionStore(selectIsPremium);
  const showChangeLocationSheet = useLocationPermissionUiStore(
    (s) => s.showChangeLocationSheet
  );
  const showCustomPopup = useLocationPermissionUiStore((s) => s.showCustomPopup);
  const showManagePopup = useLocationPermissionUiStore((s) => s.showManagePopup);

  const clearSelection = useGalleryPickerSelectionStore((s) => s.clear);

  useEffect(() => {
    return () => {
      clearSelection();
    };
  }, [clearSelection]);

  useEffect(() => {
    if (cameraReturnTarget || remainingSlots > 0) return;
    showAlert(
      "Photo limit reached",
      CAMERA_STRINGS.limits.maxPhotosSelected,
      {
        primaryText: "OK",
        onPrimary: () => navigation.goBack(),
      }
    );
  }, [cameraReturnTarget, navigation, remainingSlots]);

  const submitCroppedFromGallery = useCallback(
    async (cropped: CroppedImageObject) => {
      if (cameraReturnTarget) {
        setSubmitting(true);
        try {
          await submitProcessedImageForIdentify({
            image: cropped,
            navigation,
            isPremium,
            onLimitReached: () => setShowUpgradeSheet(true),
            returnImageToAskAI,
            returnImageToFeed,
            returnImageToQuiz,
            feedDraft,
          });
        } finally {
          setSubmitting(false);
        }
        return;
      }

      if (remainingSlots <= 0) {
        showAlert(
          "Photo limit reached",
          CAMERA_STRINGS.limits.maxPhotosSelected
        );
        return;
      }

      identifyFlowLog("gallery_crop_success_return_camera");
      setSubmitting(true);
      try {
        clearSelection();
        returnGalleryCropToCamera(navigation, cropped);
      } finally {
        setSubmitting(false);
      }
    },
    [
      cameraReturnTarget,
      clearSelection,
      feedDraft,
      isPremium,
      navigation,
      remainingSlots,
      returnImageToAskAI,
      returnImageToFeed,
      returnImageToQuiz,
    ]
  );

  const handleNext = async () => {
    const selected = useGalleryPickerSelectionStore.getState().selected;
    if (!selected || submitting) return;

    analyticsService.logEvent(EVENTS.photo_uploaded);
    analyticsService.logEvent(EVENTS.identify_image_uploaded);

    setSubmitting(true);
    try {
      identifyFlowLog("gallery_cropper_started");
      const cropPath = await resolveGalleryPhotoUri(selected);
      identifyFlowLog("gallery_export_completed", {
        pathPrefix: cropPath.slice(0, 32),
      });
      setSubmitting(false);

      await settleBeforeNativeCropper();
      const cropped = await openInteractiveCropper(cropPath);
      if (!cropped) {
        identifyFlowLog("gallery_cropper_cancelled");
        return;
      }

      await submitCroppedFromGallery(cropped);
    } catch (error) {
      setSubmitting(false);
      identifyFlowLog("gallery_submit_failed", {
        message: String((error as Error)?.message ?? error),
      });
      console.error("Gallery submit failed:", error);
      showAlert(
        "Unable to load photo",
        error instanceof Error
          ? error.message
          : "Please try another image from your gallery."
      );
    }
  };

  const handleGalleryBlocked = useCallback(() => {
    const copy = getGalleryPermissionUiCopy();
    showAlert(
      copy.deniedTitle ?? copy.title,
      copy.deniedSubtitle ?? copy.subtitle,
      {
        secondaryText: "Cancel",
        primaryText: copy.openSettingsLabel,
        onPrimary: () => void openDeviceSettings(),
      }
    );
  }, []);

  const applyPickResult = useCallback(
    (
      result: Awaited<
        ReturnType<
          | typeof pickAndroidGalleryImageForIdentify
          | typeof pickIosGalleryImageForIdentify
        >
      >
    ) => {
      if (result.status === "success") {
        setSelected(result.photo);
        setThumbUri(result.photo.uri);
        return;
      }
      if (result.status === "cancelled" || result.status === "blocked") {
        if (navigation.canGoBack()) {
          navigation.goBack();
        }
      }
    },
    [navigation, setSelected, setThumbUri]
  );

  const runGalleryPicker = useCallback(
    async (options?: { exitOnCancel?: boolean }) => {
      setPickerLoading(true);
      try {
        const result = isAndroid
          ? await pickAndroidGalleryImageForIdentify({
              onGalleryBlocked: handleGalleryBlocked,
            })
          : await pickIosGalleryImageForIdentify();

        if (result.status === "success") {
          applyPickResult(result);
          return;
        }
        if (options?.exitOnCancel !== false) {
          applyPickResult(result);
        }
      } catch (error) {
        console.error("Gallery pick failed:", error);
        if (options?.exitOnCancel !== false && navigation.canGoBack()) {
          navigation.goBack();
        }
      } finally {
        setPickerLoading(false);
      }
    },
    [applyPickResult, handleGalleryBlocked, navigation]
  );

  const initialPickDoneRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (selectedPhoto) {
        setPickerLoading(false);
        return undefined;
      }
      if (initialPickDoneRef.current) return undefined;
      initialPickDoneRef.current = true;
      void runGalleryPicker();
      return () => {
        initialPickDoneRef.current = false;
      };
    }, [runGalleryPicker, selectedPhoto])
  );

  const overlayBlocksGalleryGrid =
    showUpgradeSheet ||
    showChangeLocationSheet ||
    showCustomPopup ||
    showManagePopup;

  const footerBottomInset = Math.max(insets.bottom, 12);
  const gridFooterPadding =
    !showUpgradeSheet ? GALLERY_FOOTER_RESERVE + footerBottomInset : 0;

  const renderGalleryHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <MaterialIcons name="close" size={24} color={theme.colors.textPrimary} />
      </TouchableOpacity>

      <Text variant="body" size="small" weight="medium">
        Gallery
      </Text>

      <TouchableOpacity
        onPress={() => navigation.navigate("CameraMain")}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <MaterialIcons
          name="photo-camera"
          size={24}
          color={theme.colors.textPrimary}
        />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: theme.colors.surfaceSecondary },
      ]}
      edges={["top", "bottom"]}
    >
      <View style={styles.mainColumn}>
        {!overlayBlocksGalleryGrid ? (
          <>
            {renderGalleryHeader()}
            <View
              style={[
                styles.gridHost,
                gridFooterPadding > 0 && { paddingBottom: gridFooterPadding },
              ]}
            >
              <GalleryPickerAndroidReview
                loading={pickerLoading && !selectedPhoto}
                onChoosePhoto={() =>
                  void runGalleryPicker({ exitOnCancel: false })
                }
              />
            </View>
          </>
        ) : null}

        {!showUpgradeSheet ? (
          <GalleryPickerFooter
            bottomInset={footerBottomInset}
            submitting={submitting}
            onNext={handleNext}
            layout="overlay"
          />
        ) : null}
      </View>

      <LimitReachedBottomSheet
        visible={showUpgradeSheet}
        onClose={() => setShowUpgradeSheet(false)}
        onUpgrade={() => {
          analyticsService.logEvent(EVENTS.identification_limit_upgrade_click, {
            source: "gallery_picker",
          });
          setShowUpgradeSheet(false);
          navigateToSubscriptionMain();
        }}
        limitType="identification"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
  },
  mainColumn: {
    flex: 1,
    minHeight: 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  gridHost: {
    flex: 1,
    minHeight: 0,
  },
});
