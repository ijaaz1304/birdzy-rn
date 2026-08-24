/**
 * Gallery Picker Screen
 * iOS: in-app CameraRoll grid. Android: embedded system photo picker (API 34+).
 */

import React, { useCallback, useEffect, useState } from "react";
import { Modal, Platform, Pressable, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
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
import { GalleryAccessPopup } from "../../../components/GalleryAccessPopup";
import { checkStoragePermission } from "../../../services/permissions";
import {
  GalleryPickerFooter,
  GALLERY_FOOTER_RESERVE,
  useGalleryAccentColor,
} from "../components/GalleryPickerFooter";
import {
  GalleryPickerGrid,
} from "../components/GalleryPickerGrid";
import { useDevicePhotoLibrary } from "../useDevicePhotoLibrary";
import { getPathForNativeCropper, resolveGalleryPhotoUri } from "../resolveGalleryPhotoUri";
import { settleBeforeNativeCropper } from "../camera.utils";
import { openInteractiveCropper, openPickerWithCrop } from "../interactiveCrop";
import {
  CroppedImageObject,
  getMimeType,
} from "../cropImageAndReturnObject";
import { normalizeFileUri } from "../../../utils/imageProcessing/normalizeFileUri";
import { isEmbeddedPhotoPickerAvailable } from "../embeddedPhotoPicker";
import { useGalleryPickerSelectionStore } from "../galleryPickerSelection.store";
import { identifyFlowLog } from "../identifyFlowLog";
import { submitProcessedImageForIdentify } from "../identifyImageFlow";
import { analyticsService } from "../../../services/analytics/analytics.service";
import { EVENTS } from "../../../services/analytics/analytics.events";
import { navigateToSubscriptionMain } from "../../../utils/navigation";
import { LimitReachedBottomSheet } from "../../../molecules/Modal";
import {
  useSubscriptionStore,
  selectIsPremium,
} from "../../../features/subscription/subscription.store";
import { canIdentifyPhoto } from "../../../services/session/usageLimit.service";
import { showAlert } from "../../../store/alert.store";
import { useLocationPermissionUiStore } from "../locationPermissionUi.store";

type GalleryPickerRouteProp = RouteProp<CameraStackParamList, "GalleryPicker">;
type GalleryPickerNavigationProp = NativeStackNavigationProp<
  CameraStackParamList,
  "GalleryPicker"
>;

const isIos = Platform.OS === "ios";
const isAndroid = Platform.OS === "android";

const buildGalleryImage = (
  uri: string,
  width?: number,
  height?: number
): CroppedImageObject => {
  const normalized = normalizeFileUri(uri);
  return {
    uri: normalized,
    previewUri: `${normalized}${normalized.includes("?") ? "&" : "?"}t=${Date.now()}`,
    fileName:
      normalized.split("/").pop()?.split("?")[0] || `image-${Date.now()}.jpg`,
    type: getMimeType(normalized),
    width,
    height,
  };
};

export const GalleryPickerScreen: React.FC = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<GalleryPickerNavigationProp>();
  const route = useRoute<GalleryPickerRouteProp>();
  const returnImageToAskAI = route.params?.returnImageToAskAI === true;
  const accentColor = useGalleryAccentColor();

  const [permissionReady, setPermissionReady] = useState(false);
  const [showPhotosPopup, setShowPhotosPopup] = useState(false);
  const [photosBlocked, setPhotosBlocked] = useState(false);
  const [showAlbumPicker, setShowAlbumPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showUpgradeSheet, setShowUpgradeSheet] = useState(false);
  const [androidEmbeddedAvailable, setAndroidEmbeddedAvailable] = useState<
    boolean | null
  >(isAndroid ? null : false);
  const [androidPickerLoading, setAndroidPickerLoading] = useState(false);

  const isPremium = useSubscriptionStore(selectIsPremium);
  const showChangeLocationSheet = useLocationPermissionUiStore(
    (s) => s.showChangeLocationSheet
  );
  const showCustomPopup = useLocationPermissionUiStore((s) => s.showCustomPopup);
  const showManagePopup = useLocationPermissionUiStore((s) => s.showManagePopup);

  const iosLibraryEnabled = isIos && permissionReady;
  const {
    photos,
    albums,
    activeAlbum,
    selectAlbum,
    loading,
    loadingMore,
    loadMore,
  } = useDevicePhotoLibrary(iosLibraryEnabled);
  const albumTitle = activeAlbum ?? "Gallery";

  const clearSelection = useGalleryPickerSelectionStore((s) => s.clear);

  useEffect(() => {
    return () => {
      clearSelection();
    };
  }, [clearSelection]);

  const ensurePhotosPermission = useCallback(async () => {
    if (!isIos) return;
    const storage = await checkStoragePermission();
    if (storage.granted) {
      setShowPhotosPopup(false);
      setPermissionReady(true);
      return;
    }
    setPhotosBlocked(!!storage.blocked);
    setShowPhotosPopup(true);
    setPermissionReady(false);
  }, []);

  useEffect(() => {
    if (isIos) {
      ensurePhotosPermission();
    }
  }, [ensurePhotosPermission]);

  useEffect(() => {
    if (!isAndroid) return;
    let cancelled = false;
    isEmbeddedPhotoPickerAvailable().then((available) => {
      if (!cancelled) {
        setAndroidEmbeddedAvailable(available);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (isIos) {
        ensurePhotosPermission();
      }
    }, [ensurePhotosPermission])
  );

  const submitCroppedFromGallery = useCallback(
    async (cropped: CroppedImageObject) => {
      if (returnImageToAskAI) {
        setSubmitting(true);
        try {
          await submitProcessedImageForIdentify({
            image: cropped,
            navigation,
            isPremium,
            onLimitReached: () => setShowUpgradeSheet(true),
            returnImageToAskAI: true,
          });
          const cameraStack = navigation.getParent();
          if (typeof (cameraStack as any)?.popToTop === "function") {
            (cameraStack as any).popToTop();
          } else {
            navigation.goBack();
          }
        } finally {
          setSubmitting(false);
        }
        return;
      }

      identifyFlowLog("gallery_crop_success_navigating");
      setSubmitting(true);
      try {
        await submitProcessedImageForIdentify({
          image: cropped,
          displayImage: cropped,
          navigation,
          isPremium,
          onLimitReached: () => setShowUpgradeSheet(true),
          replace: true,
        });
      } finally {
        setSubmitting(false);
      }
    },
    [isPremium, navigation, returnImageToAskAI]
  );

  const openAndroidSystemPicker = useCallback(async () => {
    if (androidPickerLoading || submitting) return;
    if (!returnImageToAskAI && !isPremium) {
      const allowed = await canIdentifyPhoto();
      if (!allowed) {
        setShowUpgradeSheet(true);
        return;
      }
    }
    analyticsService.logEvent(EVENTS.photo_uploaded);
    analyticsService.logEvent(EVENTS.identify_image_uploaded);
    setAndroidPickerLoading(true);
    try {
      identifyFlowLog("gallery_android_pick_crop_started");
      const cropped = await openPickerWithCrop();
      if (!cropped) {
        identifyFlowLog("gallery_android_pick_crop_cancelled");
        return;
      }
      await submitCroppedFromGallery(cropped);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (!message.toLowerCase().includes("cancel")) {
        console.error("Android gallery picker failed:", error);
      }
    } finally {
      setAndroidPickerLoading(false);
    }
  }, [
    androidPickerLoading,
    isPremium,
    returnImageToAskAI,
    submitCroppedFromGallery,
    submitting,
  ]);

  const handleOpenAndroidSystemPicker = useCallback(() => {
    void openAndroidSystemPicker();
  }, [openAndroidSystemPicker]);

  const handleNext = async () => {
    const selected = useGalleryPickerSelectionStore.getState().selected;
    if (!selected || submitting) return;

    // ——— Android embedded grid: in-app pick → analysis (no second native cropper) ———
    if (isAndroid) {
      setSubmitting(true);
      try {
        identifyFlowLog("gallery_next_pressed");
        const resolvedUri = await resolveGalleryPhotoUri(selected);
        identifyFlowLog("gallery_uri_resolved", {
          pathPrefix: resolvedUri.slice(0, 32),
        });
        analyticsService.logEvent(EVENTS.photo_uploaded);
        analyticsService.logEvent(EVENTS.identify_image_uploaded);

        if (!returnImageToAskAI && !isPremium) {
          const allowed = await canIdentifyPhoto();
          if (!allowed) {
            analyticsService.logEvent(EVENTS.identification_limit_reached, {
              source: "gallery_picker",
            });
            analyticsService.logEvent(EVENTS.identification_limit_exceeded);
            setShowUpgradeSheet(true);
            return;
          }
        }

        await submitCroppedFromGallery(
          buildGalleryImage(resolvedUri, selected.width, selected.height)
        );
      } catch (error) {
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
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // ——— iOS: export → native cropper → Analysis ———
    if (!returnImageToAskAI && !isPremium) {
      const allowed = await canIdentifyPhoto();
      if (!allowed) {
        analyticsService.logEvent(EVENTS.identification_limit_reached, {
          source: "gallery_picker",
        });
        analyticsService.logEvent(EVENTS.identification_limit_exceeded);
        setShowUpgradeSheet(true);
        return;
      }
    }

    analyticsService.logEvent(EVENTS.photo_uploaded);
    analyticsService.logEvent(EVENTS.identify_image_uploaded);

    setSubmitting(true);
    try {
      identifyFlowLog("gallery_export_started");
      const cropPath = await getPathForNativeCropper(selected);
      identifyFlowLog("gallery_export_completed", {
        pathPrefix: cropPath.slice(0, 32),
      });
      setSubmitting(false);

      // Open cropper on GalleryPicker — no VisionCamera; short settle only.
      identifyFlowLog("gallery_cropper_started");
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

  const overlayBlocksGalleryUi =
    showUpgradeSheet ||
    showChangeLocationSheet ||
    showCustomPopup ||
    showManagePopup;

  const footerBottomInset = Math.max(insets.bottom, 12);
  const showAndroidSystemFallback = isAndroid && androidEmbeddedAvailable === false;
  const useAndroidEmbeddedPicker =
    isAndroid && androidEmbeddedAvailable === true;
  const showFooter =
    (isIos && permissionReady) ||
    (isAndroid &&
      (androidEmbeddedAvailable === true || androidEmbeddedAvailable === false));

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: theme.colors.surfaceSecondary },
      ]}
      edges={["top", "bottom"]}
    >
      {!overlayBlocksGalleryUi && (
        <>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialIcons
                name="close"
                size={24}
                color={theme.colors.textPrimary}
              />
            </TouchableOpacity>

            {isIos ? (
              <TouchableOpacity
                style={styles.headerTitleRow}
                onPress={() => setShowAlbumPicker(true)}
                activeOpacity={0.7}
              >
                <Text variant="body" size="small" weight="medium">
                  {albumTitle}
                </Text>
                <MaterialIcons
                  name="keyboard-arrow-down"
                  size={16}
                  color={theme.colors.textPrimary}
                />
              </TouchableOpacity>
            ) : (
              <Text variant="body" size="small" weight="medium">
                Gallery
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

          <View
            style={[
              styles.gridHost,
              showFooter &&
                isIos && {
                  paddingBottom: GALLERY_FOOTER_RESERVE + footerBottomInset,
                },
              useAndroidEmbeddedPicker && styles.androidEmbeddedGridHost,
            ]}
            pointerEvents={useAndroidEmbeddedPicker ? "box-none" : "auto"}
          >
            <GalleryPickerGrid
              permissionReady={permissionReady}
              androidEmbeddedAvailable={androidEmbeddedAvailable}
              androidPickerLoading={androidPickerLoading}
              onOpenAndroidSystemPicker={handleOpenAndroidSystemPicker}
              accentColor={accentColor}
              photos={photos}
              loading={loading}
              loadingMore={loadingMore}
              loadMore={loadMore}
            />
          </View>

          {showFooter ? (
            <GalleryPickerFooter
              bottomInset={footerBottomInset}
              showAndroidSystemFallback={showAndroidSystemFallback}
              androidPickerLoading={androidPickerLoading}
              submitting={submitting}
              onOpenAndroidSystemPicker={handleOpenAndroidSystemPicker}
              onNext={handleNext}
              layout={isIos ? "overlay" : "stacked"}
            />
          ) : null}
        </>
      )}

      {isIos ? (
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
      ) : null}

      {isIos ? (
        <GalleryAccessPopup
          visible={showPhotosPopup}
          onClose={() => {
            setShowPhotosPopup(false);
            navigation.goBack();
          }}
          onAccessGranted={() => {
            setShowPhotosPopup(false);
            setPermissionReady(true);
          }}
          photosBlocked={photosBlocked}
          onBlockedChange={setPhotosBlocked}
        />
      ) : null}

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
  androidEmbeddedGridHost: {
    overflow: "hidden",
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
