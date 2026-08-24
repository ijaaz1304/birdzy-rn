/**
 * Crop Image Screen
 * Uses the shared openInteractiveCropper entry (same path handling as identify flow).
 */

import { AppImage } from "@/components/AppImage";
import { FEED_CROPPER_OPTIONS } from "@/constants/imagePipeline.constants";
import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  InteractionManager,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Icon from "react-native-vector-icons/Ionicons";
import { useTheme } from "../../../hooks/useTheme";
import { Text } from "../../../atoms";
import { FeedStackParamList } from "../../../navigation/types";
import { openInteractiveCropper } from "../../camera/interactiveCrop";

import { Radius } from "../../../design";

import { spacing } from "../../../design-system/spacing";
import { useAppLogsStore } from "../../app-logs/app-logs.store";

const CROP_LOG = "[CropImage]";

type CropImageScreenRouteProp = RouteProp<FeedStackParamList, "CropImage">;
type CropImageScreenNavigationProp = NativeStackNavigationProp<
  FeedStackParamList,
  "CropImage"
>;

export const CropImageScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<CropImageScreenNavigationProp>();
  const route = useRoute<CropImageScreenRouteProp>();
  const { imageUri, pickerOriginalPath, title, content, itemName } =
    route.params;

  const [croppedUri, setCroppedUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const interactionHandle = InteractionManager.runAfterInteractions(() => {
      (async () => {
        const log = useAppLogsStore.getState();
        try {
          const raw = (pickerOriginalPath || imageUri || "").trim();
          if (!raw) {
            log.warn(`${CROP_LOG} empty path — goBack`);
            if (mounted) navigation.goBack();
            return;
          }

          log.info(`${CROP_LOG} open cropper`, {
            platform: Platform.OS,
            rawSuffix: raw.slice(-40),
            draftLens: {
              title: title != null ? String(title).length : undefined,
              content: content != null ? String(content).length : undefined,
              itemName: itemName != null ? String(itemName).length : undefined,
            },
          });

          if (mounted) setLoading(false);

          const cropped = await openInteractiveCropper(raw, {
            width: 1080,
            height: 1080,
            cropperOverrides: FEED_CROPPER_OPTIONS,
            fallbackToOriginal: true,
          });

          if (!mounted) return;

          if (!cropped) {
            log.debug(`${CROP_LOG} crop cancelled`);
            navigation.goBack();
            return;
          }

          log.info(`${CROP_LOG} cropped OK`, {
            pathSuffix: cropped.uri.slice(-40),
          });
          setCroppedUri(cropped.uri);
        } catch (err: unknown) {
          useAppLogsStore.getState().error(`${CROP_LOG} crop outer error`, {
            message: err instanceof Error ? err.message : String(err),
          });
          console.error("Crop failed:", err);
          if (!mounted) return;
          navigation.navigate("CreatePost", {
            editedImageUri: imageUri,
            originalImageUri: imageUri,
            title,
            content,
            itemName,
          });
        }
      })();
    });

    return () => {
      mounted = false;
      interactionHandle.cancel?.();
    };
  }, [imageUri, pickerOriginalPath, navigation, title, content, itemName]);

  const handleDone = () => {
    const log = useAppLogsStore.getState();
    if (!croppedUri) {
      log.debug(`${CROP_LOG} Done with no crop — goBack`);
      navigation.goBack();
      return;
    }
    log.info(`${CROP_LOG} Done → CreatePost`, {
      editedSuffix: croppedUri.slice(-40),
      originalSuffix: imageUri?.slice?.(-40),
    });
    navigation.navigate("CreatePost", {
      editedImageUri: croppedUri,
      originalImageUri: imageUri,
      title,
      content,
      itemName,
    });
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="close" size={28} color={theme.colors.text} />
        </TouchableOpacity>
        <Text variant="title" size="medium" weight="semibold">
          Crop Image
        </Text>
        <TouchableOpacity
          onPress={handleDone}
          disabled={loading || !croppedUri}
        >
          <Text variant="body" size="medium" weight="semibold" color="primary">
            Done
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View
          style={[
            styles.cropArea,
            { backgroundColor: theme.colors.surfaceVariant },
          ]}
        >
          {loading ? (
            <ActivityIndicator />
          ) : croppedUri ? (
            <AppImage
              source={{ uri: croppedUri }}
              style={styles.preview}
              resizeMode="contain"
            />
          ) : (
            <>
              <Icon name="image" size={64} color={theme.colors.textTertiary} />
              <Text
                variant="body"
                size="medium"
                color="textSecondary"
                style={styles.placeholderText}
              >
                Opening crop editor…
              </Text>
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing[4],
  },
  content: {
    flex: 1,
    padding: spacing[4],
  },
  cropArea: {
    flex: 1,
    borderRadius: Radius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  preview: {
    width: "100%",
    height: "100%",
  },
  placeholderText: {
    marginTop: 16,
    textAlign: "center",
  },
});
