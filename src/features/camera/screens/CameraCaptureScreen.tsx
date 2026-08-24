/**
 * Camera Capture Screen for Diagnose Flow
 * Handles camera capture specifically for disease diagnosis
 */

import { AppImage } from "@/components/AppImage";
import { CloseIcon } from "@/components/shared/CloseIcon";
import React, { useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { showAlert } from "../../../store/alert.store";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import ImagePicker from "react-native-image-crop-picker";
import { useTheme, useIsDark } from "../../../hooks/useTheme";
import { Text } from "../../../atoms";
import { CameraStackParamList } from "../../../navigation/types";
import {
  checkCameraPermission,
  checkStoragePermission,
} from "../../../services/permissions";
import { GalleryAccessPopup } from "../../../components/GalleryAccessPopup";
import { PoorResultsWarningModal } from "../../../molecules/Modal/PoorResultsWarningModal";
import { CameraTipsModal } from "../../../molecules/Modal";
import { Images } from "../../../assets";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { openInteractiveCropper } from "../interactiveCrop";
import { ensureLoadableUri } from "../camera.utils";
import { LoadingImage } from "../../../components/LoadingImage";
import { SCREEN_STORAGE_KEYS } from "../../../constants/storageConstants";

import { Radius } from "../../../design";

import { spacing } from "../../../design-system/spacing";

import { APP_COLORS } from "../../../config/colors";
import {
  CAPTURE_SHUTTER_INNER_SIZE,
  CAPTURE_SHUTTER_OUTER_SIZE,
  CAPTURE_SHUTTER_RING_BORDER,
  CAPTURE_SIDE_BUTTON_SIZE,
} from "../captureFrameLayout";

type CameraCaptureScreenNavigationProp = NativeStackNavigationProp<
  CameraStackParamList,
  "CameraCaptureScreen"
>;
type CameraCaptureScreenRouteProp = RouteProp<
  CameraStackParamList,
  "CameraCaptureScreen"
>;

interface CapturedImage {
  uri: string;
  width?: number;
  height?: number;
}

const _normalizeLocalUri = (uri: string) =>
  uri.startsWith("file://") || uri.includes("://") ? uri : `file://${uri}`;
const HAS_SEEN_CAMERA_TIPS_KEY = SCREEN_STORAGE_KEYS.HAS_SEEN_CAMERA_TIPS;

export const CameraCaptureScreen: React.FC = () => {
  const theme = useTheme();
  const isDark = useIsDark();
  const colors = theme.colors;
  const _spacing = theme.spacing;
  const radius = theme.radius;
  const navigation = useNavigation<CameraCaptureScreenNavigationProp>();
  const route = useRoute<CameraCaptureScreenRouteProp>();
  const [capturedImage, setCapturedImage] = useState<CapturedImage | null>(
    null
  );
  const [hasPermission, setHasPermission] = useState(false);
  const [showPoorResultsWarning, setShowPoorResultsWarning] = useState(false);
  const [hasSeenWarning, setHasSeenWarning] = useState(false);
  const [showTipsModal, setShowTipsModal] = useState(false);
  const [hasShownTips, setHasShownTips] = useState(false);
  const [showGalleryPopup, setShowGalleryPopup] = useState(false);
  const [photosBlocked, setPhotosBlocked] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const mode = route.params?.mode || "diagnose";

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    try {
      const result = await checkCameraPermission();
      setHasPermission(result.granted);
      if (!result.granted) {
        // Navigate back to permission gate if not authorized
        navigation.replace("CameraPermissionGate", { mode });
      }
    } catch (error) {
      console.error("Error checking camera permission:", error);
      // Navigate to permission gate on error
      navigation.replace("CameraPermissionGate", { mode });
    }
  };

  // Show tips modal once after permission is granted (Identify flow expectation)
  useEffect(() => {
    if (!hasPermission) return;
    if (hasShownTips) return;
    setHasShownTips(true);
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
  }, [hasPermission, hasShownTips]);

  const navigateToDiagnosis = async (image: CapturedImage) => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      navigation.navigate("DiagnosisLoading", {
        image: { uri: image.uri, width: image.width, height: image.height },
        displayImage: { uri: image.uri, width: image.width, height: image.height },
      });
    } catch (error) {
      console.error("Image navigation failed:", error);
      showAlert("Error", "Failed to process image. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCapture = async () => {
    try {
      // Use react-native-image-crop-picker directly to ensure we get a real file path (not content://)
      // and avoid `file://content://...` crashes on some Android devices.
      const picked = await ImagePicker.openCamera({
        mediaType: "photo",
        includeBase64: false,
        // IMPORTANT: Avoid forcing square crops (1080×1080). This can distort/cut the subject
        // and degrade AI identification quality. We only compress/resize while preserving aspect ratio.
        cropping: false,
        compressImageQuality: 0.8,
        compressImageMaxWidth: 1280,
        compressImageMaxHeight: 1280,
      });

      if ((picked as any)?.path) {
        // Immediately go to crop UI after capture.
        const cropped = await openInteractiveCropper((picked as any).path, {
          fallbackToOriginal: true,
        });
        if (__DEV__)
          console.log("[CameraCapture] Capture: after crop", {
            hasCropped: !!cropped,
          });
        if (!cropped) return;
        setCapturedImage({
          uri: cropped.uri,
          width: cropped.width,
          height: cropped.height,
        });
      }
    } catch (error) {
      console.error("Camera capture failed:", error);
      showAlert("Error", "Failed to capture image. Please try again.");
    }
  };

  const openGalleryPicker = async () => {
    try {
      const picked = await ImagePicker.openPicker({
        mediaType: "photo",
        multiple: false,
        includeBase64: false,
        cropping: false,
        compressImageQuality: 0.8,
        compressImageMaxWidth: 1280,
        compressImageMaxHeight: 1280,
      });

      const pathOrUri = (picked as any)?.path;
      if (!pathOrUri) return;

      // content:// (e.g. WhatsApp on Android) → copy to temp so preview doesn't show blank
      const uri = await ensureLoadableUri(pathOrUri);
      const width = (picked as any)?.width;
      const height = (picked as any)?.height;

      // Skip crop for gallery: cropper often causes white screen on return (Android).
      if (__DEV__)
        console.log("[CameraCapture] Gallery: submitting for diagnosis", {
          uri: uri?.slice(0, 50),
        });
      await navigateToDiagnosis({ uri, width, height });
    } catch (error) {
      const msg = String((error as Error)?.message ?? "");
      if (!msg.toLowerCase().includes("cancel")) {
        console.error("Gallery picker failed:", error);
      }
    }
  };

  const handleGallery = async () => {
    const storage = await checkStoragePermission();
    if (!storage.granted) {
      setPhotosBlocked(!!storage.blocked);
      setShowGalleryPopup(true);
      return;
    }
    await openGalleryPicker();
  };

  if (!hasPermission) {
    return null; // Will be handled by navigation
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.body}>
      <AppImage
        source={isDark ? Images.identifyBgDark : Images.identifyBg}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />

      <CameraTipsModal
        visible={showTipsModal}
        onClose={() => setShowTipsModal(false)}
        onDontShowAgain={async () => {
          try {
            await AsyncStorage.setItem(HAS_SEEN_CAMERA_TIPS_KEY, "true");
          } catch {
            // ignore
          } finally {
            setShowTipsModal(false);
          }
        }}
      />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <CloseIcon isDark={theme.mode === "dark"} size={28} />
        </TouchableOpacity>
        <Text variant="title" size="medium" weight="semibold">
          Identify Mushroom
        </Text>
        <View style={styles.placeholder} />
      </View>

      {/* Camera View - dashed border for selected photo / camera / gallery area */}
      <View
        style={[
          styles.cameraView,
          {
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderStyle: "dashed",
            borderColor: colors.border,
          },
        ]}
      >
        {capturedImage ? (
          <View style={styles.imageContainer}>
            <LoadingImage
              uri={capturedImage.uri}
              containerStyle={{ borderRadius: radius.md }}
              style={styles.previewImage}
              resizeMode="cover"
            />
            <View style={styles.imageActions}>
              <TouchableOpacity
                style={[
                  styles.retakeButton,
                  { backgroundColor: colors.surface },
                ]}
                onPress={() => setCapturedImage(null)}
              >
                <Text variant="body" size="small" weight="medium">
                  Retake
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={() => {
                  if (!hasSeenWarning) {
                    setShowPoorResultsWarning(true);
                  } else if (capturedImage) {
                    if (__DEV__)
                      console.log(
                        "[CameraCapture] Submit Photo",
                        { uri: capturedImage?.uri?.slice(0, 50) }
                      );
                    void navigateToDiagnosis(capturedImage);
                  }
                }}
                disabled={isProcessing}
              >
                <Text
                  variant="body"
                  size="small"
                  weight="medium"
                  style={{ color: colors.onPrimary }}
                >
                  Submit Photo
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.cameraPlaceholder}>
            <AppImage
              source={
                theme.mode === "dark"
                  ? Images.iconfixCameraDark
                  : Images.iconfixCamera
              }
              style={{ width: 64, height: 64 }}
              resizeMode="contain"
            />
            <Text
              variant="body"
              size="medium"
              color="textTertiary"
              style={styles.placeholderText}
            >
              Camera Preview
            </Text>
            <Text variant="body" size="small" color="textTertiary">
              Point at the mushroom to identify
            </Text>
          </View>
        )}
      </View>

      {/* Controls */}
      {!capturedImage && (
        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.galleryButton}
            onPress={handleGallery}
          >
            <AppImage
              source={Images.iconfixUpload}
              style={styles.uploadSideIcon}
              resizeMode="contain"
              preferRNImage
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.captureButton}
            onPress={handleCapture}
            activeOpacity={0.8}
          >
            <View style={styles.captureInnerRing}>
              <View style={styles.captureInnerFill} />
            </View>
          </TouchableOpacity>

          <View style={styles.placeholder} />
        </View>
      )}

      <View style={styles.hint}>
        <Text
          variant="body"
          size="small"
          color="textSecondary"
          style={styles.hintText}
        >
          Make sure the mushroom is well-lit and in focus
        </Text>
      </View>

      {/* Poor Results Warning Modal */}
      <PoorResultsWarningModal
        visible={showPoorResultsWarning}
        onClose={() => setShowPoorResultsWarning(false)}
        onUnderstood={() => {
          setHasSeenWarning(true);
          setShowPoorResultsWarning(false);
          if (capturedImage) {
            if (__DEV__)
              console.log(
                "[CameraCapture] Warning understood – submitting",
                { uri: capturedImage?.uri?.slice(0, 50) }
              );
            void navigateToDiagnosis(capturedImage);
          }
        }}
      />

      <GalleryAccessPopup
        visible={showGalleryPopup}
        onClose={() => setShowGalleryPopup(false)}
        onAccessGranted={() => openGalleryPicker()}
        photosBlocked={photosBlocked}
        onBlockedChange={setPhotosBlocked}
      />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
  },
  body: {
    flex: 1,
    minHeight: 0,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing[4],
  },
  placeholder: {
    width: 28,
  },
  cameraView: {
    flex: 1,
    minHeight: 0,
    margin: spacing[4],
    borderRadius: Radius.md,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  cameraPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    marginTop: 16,
    marginBottom: 8,
  },
  imageContainer: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  imageActions: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: "row",
    gap: 12,
  },
  retakeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: "center",
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: "center",
  },
  controls: {
    flexShrink: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingBottom: 32,
    direction: "ltr",
  },
  galleryButton: {
    width: CAPTURE_SIDE_BUTTON_SIZE,
    height: CAPTURE_SIDE_BUTTON_SIZE,
    justifyContent: "center",
    alignItems: "center",
  },
  uploadSideIcon: {
    width: CAPTURE_SIDE_BUTTON_SIZE,
    height: CAPTURE_SIDE_BUTTON_SIZE,
  },
  captureButton: {
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
    borderColor: APP_COLORS.modalTextOnPrimary,
    justifyContent: "center",
    alignItems: "center",
  },
  captureInnerFill: {
    width: CAPTURE_SHUTTER_INNER_SIZE,
    height: CAPTURE_SHUTTER_INNER_SIZE,
    borderRadius: CAPTURE_SHUTTER_INNER_SIZE / 2,
    backgroundColor: APP_COLORS.modalTextOnPrimary,
  },
  hint: {
    flexShrink: 0,
    paddingHorizontal: spacing[4],
    paddingBottom: 16,
  },
  hintText: {
    textAlign: "center",
  },
});
