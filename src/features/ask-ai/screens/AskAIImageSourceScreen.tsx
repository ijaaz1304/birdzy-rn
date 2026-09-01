/**
 * Ask AI – Image source screen
 * Choose to take a photo or pick from gallery; both paths use crop, then return to AI chat with the image.
 */

import { AppImage } from "@/components/AppImage";
import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { showAlert } from "../../../store/alert.store";
import ImagePicker from "react-native-image-crop-picker";
import { asIdentifyImage } from "../../camera/identifyImageFlow";
import { AI_CROPPER_OPTIONS } from "../../../constants/imagePipeline.constants";
import { useTheme } from "../../../hooks/useTheme";
import { Text } from "../../../atoms";
import { Images } from "../../../assets";
import { AskAIStackParamList } from "../../../navigation/types";
import {
  checkStoragePermission,
  openDeviceSettings,
} from "../../../services/permissions";
import { GalleryAccessPopup } from "../../../components/GalleryAccessPopup";
import { analyticsService } from "../../../services/analytics/analytics.service";
import { EVENTS } from "../../../services/analytics/analytics.events";

import { Radius } from "../../../design";

const normalizeLocalUri = (uri: string) =>
  uri.startsWith("file://") || uri.includes("://") ? uri : `file://${uri}`;

type NavProp = NativeStackNavigationProp<
  AskAIStackParamList,
  "AskAIImageSource"
>;

const CROP_OPTIONS = AI_CROPPER_OPTIONS;

export const AskAIImageSourceScreen: React.FC = () => {
  const theme = useTheme();
  const colors = theme.colors;
  const spacing = theme.spacing;
  const radius = theme.radius;
  const navigation = useNavigation<NavProp>();
  const [showGalleryPopup, setShowGalleryPopup] = useState(false);
  const [photosBlocked, setPhotosBlocked] = useState(false);

  const handleCapture = async () => {
    try {
      analyticsService.logEvent(EVENTS.ask_ai_camera_used);
      const picked = await ImagePicker.openCamera({
        mediaType: "photo",
        includeBase64: false,
        cropping: true,
        ...CROP_OPTIONS,
      });
      if ((picked as any)?.path) {
        const uri = normalizeLocalUri((picked as any).path);
        const processed = await asIdentifyImage(uri);
        if (!processed) return;
        navigation.navigate("AskAIMain", { selectedImageUri: processed.uri });
      }
    } catch (error: any) {
      const msg = String(error?.message ?? "");
      if (msg.toLowerCase().includes("permission")) {
        showAlert(
          "Camera permission needed",
          "To capture a photo we need camera access. Open settings to allow camera?",
          {
            secondaryText: "Cancel",
            primaryText: "Open Settings",
            onPrimary: () => openDeviceSettings(),
          }
        );
        return;
      }
      if (!msg.toLowerCase().includes("cancel"))
        console.error("Ask AI image source: camera failed", error);
      navigation.goBack();
    }
  };

  const openGalleryPicker = async () => {
    try {
      analyticsService.logEvent(EVENTS.ask_ai_image_uploaded);
      const picked = await ImagePicker.openPicker({
        mediaType: "photo",
        multiple: false,
        includeBase64: false,
        cropping: true,
        ...CROP_OPTIONS,
      });
      if ((picked as any)?.path) {
        const uri = normalizeLocalUri((picked as any).path);
        const processed = await asIdentifyImage(uri);
        if (!processed) return;
        navigation.navigate("AskAIMain", { selectedImageUri: processed.uri });
      }
    } catch (error: any) {
      const msg = String(error?.message ?? "");
      if (!msg.toLowerCase().includes("cancel"))
        console.error("Ask AI image source: gallery failed", error);
      navigation.goBack();
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
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top", "bottom"]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingHorizontal: spacing[4],
            paddingVertical: spacing[3],
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          style={styles.backButton}
        >
          <AppImage
            source={Images.navCancel}
            style={[styles.backIcon, { tintColor: colors.textPrimary }]}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <Text
          variant="title"
          size="medium"
          weight="semibold"
          style={styles.headerTitle}
        >
          Add photo
        </Text>
        <View style={styles.backButton} />
      </View>

      {/* Options */}
      <View style={[styles.content, { paddingHorizontal: spacing[4] }]}>
        <TouchableOpacity
          style={[
            styles.optionCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
          onPress={handleCapture}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.iconContainer,
              {
                backgroundColor: colors.surfaceVariant,
                borderRadius: radius.full,
              },
            ]}
          >
            <AppImage
              source={
                theme.mode === "dark"
                  ? Images.iconfixCameraDark
                  : Images.askAiCaptureBird
              }
              style={{ width: 36, height: 36 }}
              resizeMode="contain"
            />
          </View>
          <Text
            variant="title"
            size="medium"
            weight="semibold"
            style={[styles.optionTitle, { color: colors.textPrimary }]}
          >
            Take photo
          </Text>
          <Text
            variant="body"
            size="small"
            style={[styles.optionSubtitle, { color: colors.textSecondary }]}
          >
            Capture and crop an image
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.optionCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
          onPress={handleUpload}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.iconContainer,
              {
                backgroundColor: colors.surfaceVariant,
                borderRadius: radius.full,
              },
            ]}
          >
            <AppImage
              source={
                theme.mode === "dark"
                  ? Images.uploadIconDark
                  : Images.askAiUploadBird
              }
              style={{ width: 36, height: 36 }}
              resizeMode="contain"
            />
          </View>
          <Text
            variant="title"
            size="medium"
            weight="semibold"
            style={[styles.optionTitle, { color: colors.textPrimary }]}
          >
            Choose from gallery
          </Text>
          <Text
            variant="body"
            size="small"
            style={[styles.optionSubtitle, { color: colors.textSecondary }]}
          >
            Select and crop an image
          </Text>
        </TouchableOpacity>
      </View>

      <GalleryAccessPopup
        visible={showGalleryPopup}
        onClose={() => setShowGalleryPopup(false)}
        onAccessGranted={() => {
          setShowGalleryPopup(false);
          openGalleryPicker();
        }}
        photosBlocked={photosBlocked}
        onBlockedChange={setPhotosBlocked}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  backIcon: {
    width: 24,
    height: 24,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
  },
  content: {
    flex: 1,
    paddingTop: 32,
    gap: 20,
  },
  optionCard: {
    padding: 24,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: "center",
    minHeight: 140,
  },
  iconContainer: {
    width: 72,
    height: 72,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  optionTitle: {
    marginBottom: 4,
  },
  optionSubtitle: {
    opacity: 0.9,
  },
});
