/**
 * Photo Selection Screen
 * Select/capture image, crop, then continue to questionnaire.
 * Camera uses the shared identify camera; gallery permission recovery is inline.
 */

import { AppImage } from "@/components/AppImage";
import React, { useCallback, useEffect, useState } from "react";
import { AppState, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import ImagePicker from "react-native-image-crop-picker";
import { navigateToIdentifyCameraScreen } from "../../camera/identifyCameraNavigation";
import { openInteractiveCropper } from "../../camera/interactiveCrop";
import {
  launchIosGalleryImage,
  usesIosPhpPickerGallery,
} from "../../camera/iosGallerySelection";
import { useTheme, useIsDark } from "../../../hooks/useTheme";
import { AppText } from "../../../components/shared";
import { Images, CancelIconLight, CancelIconDark } from "../../../assets";
import { PermissionRecoveryState } from "../../../components/PermissionRecoveryState";
import {
  checkStoragePermission,
  openDeviceSettings,
} from "../../../services/permissions";
import { getGalleryPermissionUiCopy } from "../../../services/permissions/permissionUiCopy";
import { BirdPersonalityStackParamList } from "../../../navigation/types";

import { FONTS } from "../../../common/typography";

import { spacing } from "../../../design-system/spacing";

type NavigationProp = NativeStackNavigationProp<
  BirdPersonalityStackParamList,
  "PhotoSelection"
>;

const normalizeLocalUri = (uri: string) =>
  uri.startsWith("file://") || uri.includes("://") ? uri : `file://${uri}`;

const IMAGE_PICKER_OPTIONS = {
  mediaType: "photo" as const,
  includeBase64: false,
  cropping: true,
  width: 1080,
  height: 1080,
  freeStyleCropEnabled: true,
  compressImageQuality: 0.8,
  compressImageMaxWidth: 1280,
  compressImageMaxHeight: 1280,
  cropperToolbarTitle: "Crop Image",
};

export const PhotoSelectionScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const theme = useTheme();
  const colors = theme.colors;
  const Space = theme.spacing;
  const Radius = theme.radius;
  const isDark = useIsDark();

  const [photosBlocked, setPhotosBlocked] = useState(false);
  const galleryRecoveryCopy = getGalleryPermissionUiCopy();

  const syncPhotosPermission = useCallback(async () => {
    const storage = await checkStoragePermission();
    setPhotosBlocked(!storage.granted && !!storage.blocked);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void syncPhotosPermission();
    }, [syncPhotosPermission])
  );

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active") return;
      void syncPhotosPermission();
    });
    return () => sub.remove();
  }, [syncPhotosPermission]);

  const handleCapture = () => {
    navigateToIdentifyCameraScreen("quiz");
  };

  const openGalleryPicker = async () => {
    try {
      if (usesIosPhpPickerGallery()) {
        const picked = await launchIosGalleryImage();
        if (picked.status === "cancelled") return;
        if (picked.status === "error") {
          console.error("Gallery picker failed:", picked.message);
          return;
        }
        const cropped = await openInteractiveCropper(picked.uri, {
          width: 1080,
          height: 1080,
          cropperOverrides: {
            freeStyleCropEnabled: true,
            compressImageQuality: 0.8,
            compressImageMaxWidth: 1280,
            compressImageMaxHeight: 1280,
            cropperToolbarTitle: "Crop Image",
          },
        });
        if (!cropped) return;
        navigation.navigate("Questionnaire", { photoUri: cropped.uri });
        return;
      }

      const picked = await ImagePicker.openPicker({
        ...IMAGE_PICKER_OPTIONS,
        multiple: false,
      });
      if ((picked as { path?: string })?.path) {
        navigation.navigate("Questionnaire", {
          photoUri: normalizeLocalUri((picked as { path: string }).path),
        });
      }
    } catch (error: unknown) {
      const msg = String((error as Error)?.message ?? "");
      if (msg.toLowerCase().includes("permission")) {
        const storage = await checkStoragePermission();
        if (storage.blocked) {
          setPhotosBlocked(true);
        }
      }
      if (!msg.toLowerCase().includes("cancel")) {
        console.error("Gallery picker failed:", error);
      }
    }
  };

  const handleUpload = async () => {
    if (!usesIosPhpPickerGallery() && photosBlocked) return;
    await openGalleryPicker();
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surfaceSecondary },
      ]}
    >
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View
          style={[
            styles.header,
            {
              paddingHorizontal: Space[6],
              paddingTop: Space[4],
            },
          ]}
        >
          <AppText
            variant="title20"
            color={colors.textPrimary}
            style={styles.headerTitle}
          >
            Select your photo
          </AppText>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            style={styles.closeButton}
          >
            {isDark ? (
              <CancelIconDark width={24} height={24} />
            ) : (
              <CancelIconLight width={24} height={24} />
            )}
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.tipsOuter,
            {
              paddingHorizontal: Space[6],
              paddingTop: Space[4],
              paddingBottom: Space[2],
            },
          ]}
        >
          <View
            style={[
              styles.tipsCard,
              { backgroundColor: colors.surfaceSecondary },
            ]}
          >
            <View style={styles.tipRow}>
              <AppText
                variant="body14"
                color={colors.textPrimary}
                style={styles.tipText}
              >
                ✅ Face centered, bright, no filter
              </AppText>
            </View>
            <View style={[styles.tipRow, styles.tipRowSecond]}>
              <AppText
                variant="body14"
                color={colors.textPrimary}
                style={styles.tipText}
              >
                ❌ No group shots, masks, or low-light images
              </AppText>
            </View>
          </View>
        </View>

        <View
          style={[
            styles.optionsContainer,
            { paddingHorizontal: Space[6], paddingTop: Space[4] },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.optionCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: Radius.lg ?? 16,
                borderStyle: "dashed",
                borderWidth: 1.5,
              },
            ]}
            onPress={handleCapture}
            activeOpacity={0.7}
          >
            <View style={styles.iconContainer}>
              <AppImage
                source={Images.findYourBirdCamera}
                style={styles.optionIcon}
                resizeMode="contain"
              />
            </View>
            <AppText
              variant="body16"
              color={colors.textPrimary}
              style={[styles.optionLabel, { marginTop: Space[3] }]}
            >
              Capture a face photo
            </AppText>
          </TouchableOpacity>

          <AppText
            variant="body14"
            color={colors.textSecondary}
            style={styles.orSeparator}
          >
            or
          </AppText>

          {photosBlocked && !usesIosPhpPickerGallery() ? (
            <View style={styles.recoveryHost}>
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
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.optionCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderRadius: Radius.lg ?? 16,
                  borderStyle: "dashed",
                  borderWidth: 1.5,
                },
              ]}
              onPress={() => void handleUpload()}
              activeOpacity={0.7}
            >
              <View style={styles.iconContainer}>
                <AppImage
                  source={Images.askAiUploadBird}
                  style={styles.optionIcon}
                  resizeMode="contain"
                />
              </View>
              <AppText
                variant="body16"
                color={colors.textPrimary}
                style={[styles.optionLabel, { marginTop: Space[3] }]}
              >
                Upload from gallery
              </AppText>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 16,
  },
  headerTitle: {
    flex: 1,
    fontFamily: FONTS.bold,
    textAlign: "left",
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  tipsOuter: {
    width: "100%",
    alignSelf: "stretch",
  },
  tipsCard: {
    width: "100%",
    alignSelf: "stretch",
    borderRadius: 16,
    padding: 12,
  },
  tipRow: {
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  tipRowSecond: {
    marginTop: 4,
  },
  tipText: {
    fontFamily: FONTS.medium,
    lineHeight: 20,
  },
  optionsContainer: {
    flex: 1,
    alignItems: "center",
  },
  recoveryHost: {
    width: "100%",
    minHeight: 180,
    justifyContent: "center",
  },
  orSeparator: {
    textAlign: "center",
    marginVertical: spacing[2],
  },
  optionCard: {
    width: 240,
    padding: 28,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 140,
  },
  optionLabel: {
    alignSelf: "stretch",
    textAlign: "left",
    fontFamily: FONTS.medium,
    lineHeight: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
  },
  optionIcon: {
    width: 56,
    height: 56,
  },
});
