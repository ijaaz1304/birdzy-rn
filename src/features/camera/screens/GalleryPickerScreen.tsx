/**
 * Gallery Picker Screen
 * iOS: in-app CameraRoll grid + location footer → crop → identify.
 * Android: system picker → review UI (picked image + location footer) → crop → identify.
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AppState,
  Modal,
  Platform,
  Pressable,
  ScrollView,
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
import { GalleryPickerGrid } from "../components/GalleryPickerGrid";
import { GalleryPickerAndroidReview } from "../components/GalleryPickerAndroidReview";
import { PermissionRecoveryState } from "../../../components/PermissionRecoveryState";
import { useDevicePhotoLibrary } from "../useDevicePhotoLibrary";
import {
  getPathForNativeCropper,
  resolveGalleryPhotoUri,
} from "../resolveGalleryPhotoUri";
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
import {
  resolveIdentifyGalleryAccess,
  runIdentifyGalleryNativeRequest,
} from "../identifyGalleryAccessFlow";
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
  checkStoragePermission,
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

const isIos = Platform.OS === "ios";
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

  const [permissionReady, setPermissionReady] = useState(false);
  const [photosBlocked, setPhotosBlocked] = useState(false);
  const [permissionResolving, setPermissionResolving] = useState(isIos);
  const [showAlbumPicker, setShowAlbumPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showUpgradeSheet, setShowUpgradeSheet] = useState(false);
  const [androidPickerLoading, setAndroidPickerLoading] = useState(isAndroid);

  const setSelected = useGalleryPickerSelectionStore((s) => s.setSelected);
  const setThumbUri = useGalleryPickerSelectionStore((s) => s.setThumbUri);
  const selectedPhoto = useGalleryPickerSelectionStore((s) => s.selected);

  const isPremium = useSubscriptionStore(selectIsPremium);
  const showChangeLocationSheet = useLocationPermissionUiStore(
    (s) => s.showChangeLocationSheet
  );
  const showCustomPopup = useLocationPermissionUiStore((s) => s.showCustomPopup);
  const showManagePopup = useLocationPermissionUiStore((s) => s.showManagePopup);

  const {
    photos,
    albums,
    activeAlbum,
    selectAlbum,
    loading,
    loadingMore,
    loadMore,
  } = useDevicePhotoLibrary(isIos && permissionReady);
  const albumTitle = activeAlbum ?? "Gallery";

  const clearSelection = useGalleryPickerSelectionStore((s) => s.clear);

  useEffect(() => {
    return () => {
      clearSelection();
    };
  }, [clearSelection]);

  const galleryRecoveryCopy = getGalleryPermissionUiCopy();

  const resolvePhotosPermission = useCallback(async () => {
    if (!isIos) return;

    setPermissionResolving(true);
    try {
      const access = await resolveIdentifyGalleryAccess();

      if (access.status === "granted") {
        setPhotosBlocked(false);
        setPermissionReady(true);
        return;
      }

      if (access.status === "blocked") {
        setPhotosBlocked(true);
        setPermissionReady(false);
        return;
      }

      const requested = await runIdentifyGalleryNativeRequest();
      if (requested.status === "granted") {
        setPhotosBlocked(false);
        setPermissionReady(true);
        return;
      }

      if (requested.status === "blocked") {
        setPhotosBlocked(true);
        setPermissionReady(false);
        return;
      }

      setPhotosBlocked(false);
      setPermissionReady(false);
      if (navigation.canGoBack()) {
        navigation.goBack();
      }
    } finally {
      setPermissionResolving(false);
    }
  }, [navigation]);

  useEffect(() => {
    if (isIos) {
      void resolvePhotosPermission();
    }
  }, [resolvePhotosPermission]);

  useFocusEffect(
    useCallback(() => {
      if (!isIos) return;
      void checkStoragePermission().then((storage) => {
        if (storage.granted) {
          setPhotosBlocked(false);
          setPermissionReady(true);
        } else if (storage.blocked) {
          setPhotosBlocked(true);
          setPermissionReady(false);
        }
      });
    }, [])
  );

  useEffect(() => {
    if (!isIos) return;
    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active") return;
      void checkStoragePermission().then((storage) => {
        if (storage.granted) {
          setPhotosBlocked(false);
          setPermissionReady(true);
        } else if (storage.blocked) {
          setPhotosBlocked(true);
          setPermissionReady(false);
        }
      });
    });
    return () => sub.remove();
  }, []);

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
      const cropPath = isAndroid
        ? await resolveGalleryPhotoUri(selected)
        : await getPathForNativeCropper(selected);
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

  const applyAndroidPickResult = useCallback(
    (
      result: Awaited<ReturnType<typeof pickAndroidGalleryImageForIdentify>>
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

  const runAndroidPicker = useCallback(
    async (options?: { exitOnCancel?: boolean }) => {
      setAndroidPickerLoading(true);
      try {
        const result = await pickAndroidGalleryImageForIdentify({
          onGalleryBlocked: handleGalleryBlocked,
        });
        if (result.status === "success") {
          applyAndroidPickResult(result);
          return;
        }
        if (options?.exitOnCancel !== false) {
          applyAndroidPickResult(result);
        }
      } catch (error) {
        console.error("Android gallery pick failed:", error);
        if (options?.exitOnCancel !== false && navigation.canGoBack()) {
          navigation.goBack();
        }
      } finally {
        setAndroidPickerLoading(false);
      }
    },
    [applyAndroidPickResult, handleGalleryBlocked, navigation]
  );

  const androidInitialPickDoneRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (!isAndroid) return undefined;
      if (selectedPhoto) {
        setAndroidPickerLoading(false);
        return undefined;
      }
      if (androidInitialPickDoneRef.current) return undefined;
      androidInitialPickDoneRef.current = true;
      void runAndroidPicker();
      return () => {
        androidInitialPickDoneRef.current = false;
      };
    }, [runAndroidPicker, selectedPhoto])
  );

  const overlayBlocksGalleryGrid =
    showUpgradeSheet ||
    showChangeLocationSheet ||
    showCustomPopup ||
    showManagePopup;

  const footerBottomInset = Math.max(insets.bottom, 12);
  const showFooter = isAndroid || !permissionResolving;
  const gridFooterPadding =
    showFooter && !showUpgradeSheet
      ? GALLERY_FOOTER_RESERVE + footerBottomInset
      : 0;

  const renderGalleryHeader = (title: string, showAlbum: boolean) => (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <MaterialIcons name="close" size={24} color={theme.colors.textPrimary} />
      </TouchableOpacity>

      {showAlbum ? (
        <TouchableOpacity
          style={styles.headerTitleRow}
          onPress={() => setShowAlbumPicker(true)}
          activeOpacity={0.7}
        >
          <Text variant="body" size="small" weight="medium">
            {title}
          </Text>
          <MaterialIcons
            name="keyboard-arrow-down"
            size={16}
            color={theme.colors.textPrimary}
          />
        </TouchableOpacity>
      ) : (
        <Text variant="body" size="small" weight="medium">
          {title}
        </Text>
      )}

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

  if (isAndroid) {
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
              {renderGalleryHeader("Gallery", false)}
              <View
                style={[
                  styles.gridHost,
                  gridFooterPadding > 0 && { paddingBottom: gridFooterPadding },
                ]}
              >
                <GalleryPickerAndroidReview
                  loading={androidPickerLoading && !selectedPhoto}
                  onChoosePhoto={() =>
                    void runAndroidPicker({ exitOnCancel: false })
                  }
                />
              </View>
            </>
          ) : null}

          {showFooter && !showUpgradeSheet ? (
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
  }

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
            {renderGalleryHeader(albumTitle, true)}

            <View
              style={[
                styles.gridHost,
                gridFooterPadding > 0 && { paddingBottom: gridFooterPadding },
              ]}
            >
              {photosBlocked ? (
                <PermissionRecoveryState
                  icon="photo-library"
                  title={
                    galleryRecoveryCopy.deniedTitle ?? galleryRecoveryCopy.title
                  }
                  subtitle={
                    galleryRecoveryCopy.deniedSubtitle ??
                    galleryRecoveryCopy.subtitle
                  }
                  actionLabel={galleryRecoveryCopy.openSettingsLabel}
                  onAction={() => void openDeviceSettings()}
                />
              ) : (
                <GalleryPickerGrid
                  permissionReady={permissionReady}
                  permissionResolving={permissionResolving}
                  photos={photos}
                  loading={loading || permissionResolving}
                  loadingMore={loadingMore}
                  loadMore={loadMore}
                />
              )}
            </View>
          </>
        ) : null}

        {showFooter && !showUpgradeSheet ? (
          <GalleryPickerFooter
            bottomInset={footerBottomInset}
            submitting={submitting}
            onNext={handleNext}
            layout="overlay"
          />
        ) : null}
      </View>

      <Modal
        visible={showAlbumPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAlbumPicker(false)}
      >
        <Pressable
          style={styles.albumBackdrop}
          onPress={() => setShowAlbumPicker(false)}
        >
          <Pressable
            style={[
              styles.albumSheet,
              { backgroundColor: theme.colors.surface },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text
              variant="title"
              size="small"
              weight="semibold"
              style={styles.albumSheetTitle}
            >
              Albums
            </Text>
            <ScrollView style={styles.albumList}>
              <TouchableOpacity
                style={styles.albumRow}
                onPress={() => {
                  selectAlbum(undefined);
                  setShowAlbumPicker(false);
                }}
              >
                <Text variant="body" size="medium">
                  Gallery
                </Text>
              </TouchableOpacity>
              {albums.map((album) => (
                <TouchableOpacity
                  key={album.title}
                  style={styles.albumRow}
                  onPress={() => {
                    selectAlbum(album.title);
                    setShowAlbumPicker(false);
                  }}
                >
                  <Text variant="body" size="medium">
                    {album.title}
                  </Text>
                  <Text variant="body" size="small" color="textSecondary">
                    {album.count}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

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
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  gridHost: {
    flex: 1,
    minHeight: 0,
  },
  albumBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  albumSheet: {
    borderRadius: 16,
    maxHeight: "60%",
    paddingVertical: 16,
  },
  albumSheetTitle: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  albumList: {
    paddingHorizontal: 8,
  },
  albumRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
});
