/**
 * Photo Selection Screen
 * Full screen: select/capture image, then crop, then continue to questionnaire.
 * Camera: requests permission before capture; shows permission popup if denied.
 */

import { AppImage } from "@/components/AppImage";
import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import ImagePicker from "react-native-image-crop-picker";
import { useTheme, useIsDark } from "../../../hooks/useTheme";
import { AppText } from "../../../components/shared";
import { Images, CancelIconLight, CancelIconDark } from "../../../assets";
import { CameraAccessPopup } from "../../../components/CameraAccessPopup";
import { GalleryAccessPopup } from "../../../components/GalleryAccessPopup";
import {
  checkCameraPermission,
  checkStoragePermission,
} from "../../../services/permissions";
import { BirdPersonalityStackParamList } from "../../../navigation/types";

import { FONTS } from "../../../common/typography";

import { spacing } from "../../../design-system/spacing";

type NavigationProp = NativeStackNavigationProp<
  BirdPersonalityStackParamList,
  "PhotoSelection"
>;

const normalizeLocalUri = (uri: string) =>
  uri.startsWith("file://") || uri.includes("://") ? uri : `file://${uri}`;

export const PhotoSelectionScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const theme = useTheme();
  const colors = theme.colors;
  const Space = theme.spacing;
  const Radius = theme.radius;
  const isDark = useIsDark();
  const [showCameraPopup, setShowCameraPopup] = useState(false);
  const [cameraBlocked, setCameraBlocked] = useState(false);
  const [showGalleryPopup, setShowGalleryPopup] = useState(false);
  const [photosBlocked, setPhotosBlocked] = useState(false);

  const handleCapture = async () => {
    try {
      const picked = await ImagePicker.openCamera({
        mediaType: "photo",
        includeBase64: false,
        cropping: true,
        width: 1080,
        height: 1080,
        freeStyleCropEnabled: true,
        compressImageQuality: 0.8,
        compressImageMaxWidth: 1280,
        compressImageMaxHeight: 1280,
        cropperToolbarTitle: "Crop Image",
      });
      if ((picked as any)?.path) {
        navigation.navigate("Questionnaire", {
          photoUri: normalizeLocalUri((picked as any).path),
        });
      }
    } catch (error: any) {
      const msg = String(error?.message ?? "");
      if (msg.toLowerCase().includes("permission")) {
        const res = await checkCameraPermission();
        setCameraBlocked(!!res.blocked);
        setShowCameraPopup(true);
        return;
      }
      if (!msg.toLowerCase().includes("cancel"))
        console.error("Camera capture failed:", error);
    }
  };

  const handleCameraAccessGranted = () => {
    setShowCameraPopup(false);
    handleCapture();
  };

  const openGalleryPicker = async () => {
    try {
      const picked = await ImagePicker.openPicker({
        mediaType: "photo",
        multiple: false,
        includeBase64: false,
        cropping: true,
        width: 1080,
        height: 1080,
        freeStyleCropEnabled: true,
        compressImageQuality: 0.8,
        compressImageMaxWidth: 1280,
        compressImageMaxHeight: 1280,
        cropperToolbarTitle: "Crop Image",
      });
      if ((picked as any)?.path) {
        navigation.navigate("Questionnaire", {
          photoUri: normalizeLocalUri((picked as any).path),
        });
      }
    } catch (error: any) {
      const msg = String(error?.message ?? "");
      if (msg.toLowerCase().includes("permission")) {
        setPhotosBlocked(true);
        setShowGalleryPopup(true);
      }
      if (!msg.toLowerCase().includes("cancel"))
        console.error("Gallery picker failed:", error);
    }
  };

  const handleUpload = async () => {
    const storage = await checkStoragePermission();
    if (!storage.granted) {
      setPhotosBlocked(!!storage.blocked);
      setShowGalleryPopup(true);
      return;
    }
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
        {/* Header */}
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

        {/* Photo tips — white card, two highlighted lines */}
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

        {/* Options */}
        <View
          style={[
            styles.optionsContainer,
            { paddingHorizontal: Space[6], paddingTop: Space[4] },
          ]}
        >
          {/* Capture Image Card — dotted border */}
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
                source={Images.findYourMushCamera}
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

          {/* Upload from Gallery Card — dotted border */}
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
            onPress={handleUpload}
            activeOpacity={0.7}
          >
            <View style={styles.iconContainer}>
              <AppImage
                source={Images.askAiUploadMushroom}
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
        </View>

        <CameraAccessPopup
          visible={showCameraPopup}
          onClose={() => setShowCameraPopup(false)}
          onAccessGranted={handleCameraAccessGranted}
          cameraBlocked={cameraBlocked}
          onBlockedChange={setCameraBlocked}
        />
        <GalleryAccessPopup
          visible={showGalleryPopup}
          onClose={() => setShowGalleryPopup(false)}
          onAccessGranted={openGalleryPicker}
          photosBlocked={photosBlocked}
          onBlockedChange={setPhotosBlocked}
        />
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
