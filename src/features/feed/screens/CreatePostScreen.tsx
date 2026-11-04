/**
 * Create Post Screen
 * Dynamic component with Firestore and Storage integration
 */

import { AppImage } from "@/components/AppImage";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, TextInput, KeyboardAvoidingView, Keyboard, Platform, useWindowDimensions, InteractionManager, type KeyboardEvent } from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import Icon from "react-native-vector-icons/Ionicons";
import {
  useNavigation,
  useRoute,
  RouteProp,
  CommonActions,
  useFocusEffect,
} from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import ImagePicker from "react-native-image-crop-picker";
import {
  launchIosGalleryImage,
  usesIosPhpPickerGallery,
} from "../../camera/iosGallerySelection";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, useIsDark } from "../../../hooks/useTheme";
import { UI_COLORS } from "../../../constants/colorConstants";
import { HIT_SLOP } from "../../../constants/uiConstants";
import { Text } from "../../../atoms";
import { Avatar } from "../../../atoms";
import { Button } from "../../../atoms";
import { CancelIconLight, CancelIconDark } from "../../../assets";
import { AppSheet } from "../../../components/AppSheet/AppSheet";
import { FeedStackParamList } from "../../../navigation/types";
import { FeedConfig } from "../config/feedConfig.types";
import { feedService, storageService } from "../../../services/firebase";
import { useAuthStore } from "../../../features/auth/auth.store";
import {
  useSubscriptionStore,
  selectIsPremium,
} from "../../../features/subscription/subscription.store";
import { firebaseCrashlytics } from "../../../lib/firebase";
import {
  analyticsService,
  EVENTS,
} from "../../../services/analytics/analytics.service";
import { useToast } from "../../../hooks/useToast";
import { navigateToSubscriptionMain } from "../../../utils/navigation";
import { Images, UploadIconSvg } from "../../../assets";
import {
  checkStoragePermission,
} from "../../../services/permissions";
import { GalleryAccessPopup } from "../../../components/GalleryAccessPopup";
import { isImageCropPickerCancelError } from "../../camera/cropImageAndReturnObject";
import { openInteractiveCropper } from "../../camera/interactiveCrop";
import { navigateToIdentifyCameraScreen } from "../../camera/identifyCameraNavigation";
import { useAppLogsStore } from "../../app-logs/app-logs.store";
import {
  hasReachedFreeFeedPostLimit,
  recordFreeFeedPostCreated,
} from "../freeFeedPostLimit";

import { FONTS } from "../../../common/typography";

const CREATE_POST_LOG = "[CreatePost]";


const IMAGE_PREVIEW_HEIGHT = 280;
const POST_IMAGE_OVERLAY_BG = "#F5EBEB";
const POST_IMAGE_OVERLAY_FG = "#402122";

type CreatePostScreenNavigationProp = NativeStackNavigationProp<
  FeedStackParamList,
  "CreatePost"
>;
type CreatePostScreenRouteProp = RouteProp<FeedStackParamList, "CreatePost">;

export interface CreatePostScreenProps {
  config: FeedConfig;
  userName?: string;
  onPost?: (postId: string) => void;
}

export const CreatePostScreen: React.FC<CreatePostScreenProps> = ({
  config,
  userName,
  onPost,
}) => {
  const theme = useTheme();
  const isDark = useIsDark();
  const { width: screenWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<CreatePostScreenNavigationProp>();
  const route = useRoute<CreatePostScreenRouteProp>();
  const { user } = useAuthStore();
  const isPremium = useSubscriptionStore(selectIsPremium);
  const { showToast } = useToast();

  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const MAX_IMAGES = 2;
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [itemName, setItemName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUnlimitedSheet, setShowUnlimitedSheet] = useState(false);
  const [showGalleryPopup, setShowGalleryPopup] = useState(false);
  const [photosBlocked, setPhotosBlocked] = useState(false);
  const [loadingPost, setLoadingPost] = useState(false);
  const [pickingImage, setPickingImage] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const pickingImageRef = useRef(false);

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvent, (event: KeyboardEvent) => {
      setIsKeyboardVisible(true);
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setIsKeyboardVisible(false);
      setKeyboardHeight(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);
  const postId = route.params?.postId;
  const initialPost = route.params?.initialPost;
  const isEditMode = !!postId;

  const displayName = userName || user?.name || "User";
  const { createPost } = config;

  useFocusEffect(
    useCallback(() => {
      if (isEditMode || isPremium || !user?.id) return;
      let cancelled = false;
      void (async () => {
        const atLimit = await hasReachedFreeFeedPostLimit(user.id);
        if (!cancelled && atLimit) {
          setShowUnlimitedSheet(true);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [isEditMode, isPremium, user?.id])
  );

  // Pre-fill from initialPost when editing (so form is never empty)
  useEffect(() => {
    if (!isEditMode || !initialPost) return;
    if (initialPost.title !== undefined) setTitle(initialPost.title);
    if (initialPost.content !== undefined) setContent(initialPost.content);
    if (initialPost.itemName !== undefined) setItemName(initialPost.itemName);
    if (initialPost.image) setSelectedImages([initialPost.image]);
  }, [
    isEditMode,
    initialPost?.title,
    initialPost?.content,
    initialPost?.itemName,
    initialPost?.image,
  ]);

  // Load existing post when editing (fetches latest; may overwrite initialPost pre-fill)
  useEffect(() => {
    if (!postId || !user?.id) return;
    let cancelled = false;
    if (!initialPost) setLoadingPost(true);
    feedService
      .getPost(postId, user.id)
      .then((p) => {
        if (cancelled || !p) return;
        setTitle(p.title ?? "");
        setContent(p.content ?? "");
        setItemName(p.itemName ?? "");
        const img = p.image ?? (p as any).imageUrl;
        setSelectedImages(img ? [img] : []);
      })
      .catch(() => {
        if (!cancelled) showToast("Could not load post", "error");
      })
      .finally(() => {
        if (!cancelled) setLoadingPost(false);
      });
    return () => {
      cancelled = true;
    };
  }, [postId, user?.id]);

  const cameraReturnImageProcessedRef = useRef<string | null>(null);

  useEffect(() => {
    const editedImageUri = route.params?.editedImageUri?.trim();
    if (
      !editedImageUri ||
      cameraReturnImageProcessedRef.current === editedImageUri
    ) {
      return;
    }
    cameraReturnImageProcessedRef.current = editedImageUri;

    if (route.params?.title !== undefined) setTitle(route.params.title);
    if (route.params?.content !== undefined) setContent(route.params.content);
    if (route.params?.itemName !== undefined) setItemName(route.params.itemName);

    setSelectedImages((prev) => {
      if (prev.length >= MAX_IMAGES) return prev;
      if (prev.includes(editedImageUri)) return prev;
      return [...prev, editedImageUri];
    });
  }, [
    route.params?.editedImageUri,
    route.params?.title,
    route.params?.content,
    route.params?.itemName,
  ]);

  const cameraIcon = Images.plusIcon;

  const cropAndApplyImage = useCallback(
    async (
      pathOrUri: string,
      source: "gallery" | "camera" | "edit",
      replaceIndex?: number
    ) => {
      if (pickingImageRef.current) return;
      pickingImageRef.current = true;
      setPickingImage(true);

      const log = useAppLogsStore.getState();
      log.info(`${CREATE_POST_LOG} inline crop start`, {
        platform: Platform.OS,
        source,
        replaceIndex,
        pathSuffix: pathOrUri.slice(-32),
      });

      try {
        await new Promise<void>((resolve) => {
          InteractionManager.runAfterInteractions(() => resolve());
        });

        const cropped = await openInteractiveCropper(pathOrUri);
        if (!cropped) {
          log.debug(`${CREATE_POST_LOG} inline crop cancelled`);
          return;
        }

        analyticsService.logEvent(EVENTS.post_image_selected, {
          count:
            typeof replaceIndex === "number"
              ? selectedImages.length
              : selectedImages.length + 1,
          source: source === "edit" ? "gallery" : source,
        });

        setSelectedImages((prev) => {
          if (
            typeof replaceIndex === "number" &&
            replaceIndex >= 0 &&
            replaceIndex < prev.length
          ) {
            return prev.map((uri, i) =>
              i === replaceIndex ? cropped.uri : uri
            );
          }
          if (prev.length < MAX_IMAGES) return [...prev, cropped.uri];
          return prev;
        });

        log.info(`${CREATE_POST_LOG} inline crop applied`, {
          uriSuffix: cropped.uri.slice(-32),
        });
      } catch (e: unknown) {
        log.error(`${CREATE_POST_LOG} inline crop error`, {
          message: e instanceof Error ? e.message : String(e),
        });
        showToast("Failed to crop image", "error");
      } finally {
        pickingImageRef.current = false;
        setPickingImage(false);
      }
    },
    [selectedImages.length, showToast]
  );

  /**
   * iOS: PHPicker via react-native-image-picker → local file → crop.
   * Android: react-native-image-crop-picker openPicker → crop.
   */
  const openImageLibrary = async () => {
    const log = useAppLogsStore.getState();
    try {
      if (usesIosPhpPickerGallery()) {
        const picked = await launchIosGalleryImage();
        if (picked.status === "cancelled") {
          log.debug(`${CREATE_POST_LOG} launchImageLibrary cancelled`);
          return;
        }
        if (picked.status === "error") {
          log.error(`${CREATE_POST_LOG} launchImageLibrary error`, {
            message: picked.message,
          });
          showToast("Failed to select image", "error");
          return;
        }
        await cropAndApplyImage(picked.uri, "gallery");
        return;
      }

      const picked = await ImagePicker.openPicker({
        mediaType: "photo",
        multiple: false,
        includeBase64: false,
      });
      const pathOrUri = (picked as { path?: string })?.path?.trim();
      if (!pathOrUri) {
        log.warn(`${CREATE_POST_LOG} openPicker: empty path`);
        showToast("Failed to read image", "error");
        return;
      }
      await cropAndApplyImage(pathOrUri, "gallery");
    } catch (e: unknown) {
      if (isImageCropPickerCancelError(e)) {
        log.debug(`${CREATE_POST_LOG} openPicker cancelled`);
        return;
      }
      log.error(`${CREATE_POST_LOG} openPicker error`, {
        message: e instanceof Error ? e.message : String(e),
      });
      firebaseCrashlytics.log(
        "Image picker error: " + String((e as Error)?.message ?? e)
      );
      showToast("Failed to select image", "error");
    }
  };

  const ensureCanAddImage = () => {
    if (selectedImages.length >= MAX_IMAGES) {
      useAppLogsStore
        .getState()
        .debug(`${CREATE_POST_LOG} add image skipped (max)`);
      return false;
    }
    if (uploading || pickingImage) return false;
    return true;
  };

  const handleSelectImage = async () => {
    if (!ensureCanAddImage()) return;
    if (!usesIosPhpPickerGallery()) {
      const storage = await checkStoragePermission();
      if (!storage.granted) {
        useAppLogsStore
          .getState()
          .info(`${CREATE_POST_LOG} storage not granted`, {
            blocked: !!storage.blocked,
          });
        setPhotosBlocked(!!storage.blocked);
        setShowGalleryPopup(true);
        return;
      }
    }
    await openImageLibrary();
  };

  const handleOpenCamera = () => {
    if (!ensureCanAddImage()) return;
    navigateToIdentifyCameraScreen("feed", {
      feedDraft: {
        title,
        content,
        itemName,
        postId,
      },
    });
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEditImage = async (index: number) => {
    if (uploading || pickingImage) return;
    const uri = selectedImages[index];
    if (!uri) return;
    await cropAndApplyImage(uri, "edit", index);
  };

  const handlePost = async () => {
    const log = useAppLogsStore.getState();
    if (!user?.id) {
      log.warn(`${CREATE_POST_LOG} post blocked — not logged in`);
      showToast("Please log in to create a post", "error");
      return;
    }

    if (!content.trim()) {
      log.warn(`${CREATE_POST_LOG} post blocked — empty content`);
      showToast("Please enter post content", "error");
      return;
    }

    // Non-premium / guest: lifetime 1 post unless they upgrade.
    const isGuest = !!user?.isGuest;
    const isFreeUser = isGuest || !isPremium;
    const mustEnforcePostLimit = !isEditMode && isFreeUser;
    if (mustEnforcePostLimit && !isPremium) {
      const atLimit = await hasReachedFreeFeedPostLimit(user.id);
      log.info(`${CREATE_POST_LOG} feed post limit check`, {
        atLimit,
        willShowLimitSheet: atLimit,
      });
      if (atLimit) {
        setShowUnlimitedSheet(true);
        return;
      }
    }

    log.info(`${CREATE_POST_LOG} submit start`, {
      isEditMode,
      imageCount: selectedImages.length,
      titleLen: title.trim().length,
      contentLen: content.trim().length,
    });
    setUploading(true);
    setUploadProgress(0);

    try {
      const imageUrls: string[] = [];
      const total = selectedImages.length;
      let done = 0;

      for (let i = 0; i < selectedImages.length; i++) {
        const uri = selectedImages[i];
        const isExistingUrl =
          typeof uri === "string" &&
          (uri.startsWith("http://") || uri.startsWith("https://"));
        if (isExistingUrl) {
          imageUrls.push(uri);
          done += 1;
          setUploadProgress(Math.round((done / total) * 100));
          continue;
        }
        try {
          const fileName = `post-${Date.now()}-${user.id}-${i}.jpg`;
          const uploadResult = await storageService.uploadImage({
            path: "posts/images",
            fileName,
            uri,
            onProgress: (progress) => {
              setUploadProgress(
                Math.round(((done + progress / 100) / total) * 100)
              );
            },
          });
          imageUrls.push(uploadResult.url);
        } catch (error) {
          console.error("Error uploading image:", error);
          firebaseCrashlytics.recordError(error as Error, "image_upload_error");
          showToast(
            `Failed to upload image ${i + 1}. Posting with ${
              imageUrls.length
            } image(s)...`,
            "warning"
          );
        }
        done += 1;
        setUploadProgress(Math.round((done / total) * 100));
      }

      if (isEditMode && postId) {
        await feedService.updatePost(
          postId,
          {
            title: title.trim() || undefined,
            content: content.trim(),
            itemName: itemName.trim() || undefined,
            imageUrl: imageUrls[0],
            imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
            caption: title.trim() || undefined,
          },
          user.id
        );
        analyticsService.logEvent(EVENTS.post_updated, { post_id: postId });
        log.info(`${CREATE_POST_LOG} update success`, { postId });
        showToast("Post updated successfully!", "success");
        navigation.goBack();
      } else {
        const newPostId = await feedService.createPost({
          userId: user.id,
          userName: displayName,
          userAvatar: user.avatar,
          itemName: itemName.trim() || undefined,
          title: title.trim() || undefined,
          content: content.trim(),
          imageUrl: imageUrls[0],
          imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
          caption: title.trim() || undefined,
        });

        analyticsService.logEvent(EVENTS.post_created_success, {
          has_image: imageUrls.length > 0,
          image_count: imageUrls.length,
          has_title: !!title.trim(),
          has_item_name: !!itemName.trim(),
        });

        if ((user?.isGuest || !isPremium) && user?.id) {
          await recordFreeFeedPostCreated(user.id);
        }

        showToast("Post created successfully!", "success");
        log.info(`${CREATE_POST_LOG} create success`, { newPostId });

        if (onPost) {
          onPost(newPostId);
        }

        // Reset feed stack so we never stay on CropImage (stack is often
        // FeedMain → CreatePost → CropImage → CreatePost after crop).
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: "FeedMain" }],
          })
        );
      }
    } catch (error) {
      log.error(`${CREATE_POST_LOG} submit failed`, {
        message: error instanceof Error ? error.message : String(error),
      });
      console.error("Error creating post:", error);
      firebaseCrashlytics.recordError(error as Error, "post_creation_error");
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Failed to create post. Please try again.";
      showToast(message, "error");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const postDisabled = !content.trim() || uploading;
  /** Figma 8025:84417 — Create post sits on surface-primary (white in light mode) */
  const backgroundFillColor = theme.colors.surfacePrimary;

  if (isEditMode && loadingPost) {
    return (
      <View
        style={[
          styles.container,
          styles.loadingContainer,
          { backgroundColor: backgroundFillColor },
        ]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text allowFontScaling={false} variant="body" color="textSecondary" style={{ marginTop: 12 }}>
          Loading post...
        </Text>
      </View>
    );
  }

  return (
    <>
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: backgroundFillColor }]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Header: Create post (left), X button (right) */}
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <Text allowFontScaling={false}
            variant="display"
            size="medium"
            weight="bold"
            numberOfLines={1}
            style={[styles.headerTitle, { color: theme.colors.text }]}
          >
            {isEditMode ? "Edit post" : "Create post"}
          </Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
            hitSlop={HIT_SLOP.CLOSE}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {isDark ? (
              <CancelIconDark width={24} height={24} />
            ) : (
              <CancelIconLight width={24} height={24} />
            )}
          </TouchableOpacity>
        </View>

        {/* User Info - Avatar + Username at top */}
        <View style={styles.userRow}>
          <Avatar name={displayName} size={AVATAR_SIZE} source={user?.avatar} />
          <Text
            allowFontScaling={false}
            variant="body"
            size="medium"
            color="text"
            numberOfLines={1}
            style={styles.authorName}
          >
            {displayName}
          </Text>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Title (optional) */}
          <TextInput
            allowFontScaling={false}
            style={[
              styles.titleInput,
              {
                color: theme.colors.text,
              },
            ]}
            placeholder={createPost.titlePlaceholder}
            placeholderTextColor={theme.colors.textSecondary}
            value={title}
            onChangeText={setTitle}
            editable={!uploading}
          />
          {/* Description */}
          <TextInput
            allowFontScaling={false}
            style={[
              styles.contentInput,
              {
                color: theme.colors.text,
              },
            ]}
            placeholder={createPost.helperText(displayName)}
            placeholderTextColor={UI_COLORS.TEXT_TERTIARY}
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
            editable={!uploading}
          />

          {/* Full-width image previews with Edit + remove overlays (Figma) */}
          {selectedImages.length > 0 && (
            <View
              style={[
                styles.imagePreviewsStack,
                { marginHorizontal: -SIDE_MARGIN, width: screenWidth },
              ]}
            >
              {selectedImages.map((uri, index) => (
                <View
                  key={`${uri}-${index}`}
                  style={[
                    styles.imagePreviewContainer,
                    { width: screenWidth, height: IMAGE_PREVIEW_HEIGHT },
                  ]}
                >
                  <AppImage
                    source={{ uri }}
                    style={styles.imagePreview}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    style={styles.editImageButton}
                    onPress={() => handleEditImage(index)}
                    activeOpacity={0.8}
                    disabled={uploading || pickingImage}
                    hitSlop={HIT_SLOP.CLOSE}
                  >
                    <MaterialCommunityIcons
                      name="auto-fix"
                      size={20}
                      color={POST_IMAGE_OVERLAY_FG}
                    />
                    <Text allowFontScaling={false}
                      variant="body"
                      size="small"
                      weight="medium"
                      style={styles.editImageButtonText}
                    >
                      Edit
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => handleRemoveImage(index)}
                    activeOpacity={0.8}
                    disabled={uploading || pickingImage}
                    hitSlop={HIT_SLOP.CLOSE}
                  >
                    <Icon
                      name="close"
                      size={16}
                      color={POST_IMAGE_OVERLAY_FG}
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {uploading && uploadProgress > 0 && (
            <View style={styles.uploadProgressContainer}>
              <View
                style={[
                  styles.uploadProgressBar,
                  {
                    width: `${uploadProgress}%`,
                    backgroundColor: theme.colors.primary,
                  },
                ]}
              />
              <Text allowFontScaling={false}
                variant="body"
                size="small"
                color="text"
                style={{ marginTop: 8 }}
              >
                Uploading... {Math.round(uploadProgress)}%
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Footer - Upload icon bottom-left, Post button bottom-right */}
        <View
          style={[
            styles.footer,
            {
              borderTopColor: theme.colors.border0 ?? theme.colors.border,
              backgroundColor: backgroundFillColor,
              paddingBottom: isKeyboardVisible
                ? 12
                : Math.max(16, insets.bottom),
              ...(Platform.OS === "android" && keyboardHeight > 0
                ? {
                    marginBottom: Math.max(0, keyboardHeight - insets.bottom),
                  }
                : null),
            },
          ]}
        >
          <View style={styles.mediaActions}>
            <TouchableOpacity
              onPress={handleSelectImage}
              disabled={
                uploading || pickingImage || selectedImages.length >= MAX_IMAGES
              }
              style={styles.mediaButton}
              activeOpacity={0.7}
            >
              <UploadIconSvg
                width={MEDIA_ICON_SIZE}
                height={MEDIA_ICON_SIZE}
                color={isDark ? UI_COLORS.WHITE : UI_COLORS.BLACK}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleOpenCamera}
              disabled={
                uploading || pickingImage || selectedImages.length >= MAX_IMAGES
              }
              style={styles.mediaButton}
              activeOpacity={0.7}
            >
              <AppImage source={cameraIcon} style={styles.mediaIcon} />
            </TouchableOpacity>
          </View>
          <Button
            title={
              uploading
                ? isEditMode
                  ? "Saving..."
                  : "Posting..."
                : isEditMode
                ? "Save"
                : "Post"
            }
            variant="primary"
            size="medium"
            onPress={handlePost}
            disabled={postDisabled}
            loading={uploading}
            allowFontScaling={false}
            style={[styles.postButton, postDisabled && styles.postButtonDisabled]}
            textStyle={{
              ...styles.postButtonText,
              ...(postDisabled ? styles.postButtonTextDisabled : null),
            }}
          />
        </View>

        <AppSheet
          visible={showUnlimitedSheet}
          onClose={() => {
            setShowUnlimitedSheet(false);
            if (!isEditMode) navigation.goBack();
          }}
          type="limitReached"
          payload={{
            limitType: "feed",
            onUpgrade: () => {
              setShowUnlimitedSheet(false);
              navigateToSubscriptionMain();
            },
          }}
        />
      </KeyboardAvoidingView>

      <GalleryAccessPopup
        visible={showGalleryPopup}
        onClose={() => setShowGalleryPopup(false)}
        onAccessGranted={openImageLibrary}
        photosBlocked={photosBlocked}
        onBlockedChange={setPhotosBlocked}
      />
    </>
  );
};

/** Figma 8025:84417 layout */
const SIDE_MARGIN = 20;
const AVATAR_SIZE = 24;
const MEDIA_ICON_SIZE = 20;
/** Figma surface-disabled / button text-color disabled */
const POST_DISABLED_BG = "#D1D1D1";
const POST_DISABLED_TEXT = "#B0B0B0";

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  /** Figma Top Navigation Bar: 20 left / 12 right, 12 vertical (52pt with the 40pt close button + insets) */
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingLeft: SIDE_MARGIN,
    paddingRight: 12,
    paddingTop: 16,
    paddingBottom: 6,
  },
  /** Figma Title/18px/Bold */
  headerTitle: {
    flex: 1,
    fontFamily: FONTS.bold,
    fontSize: 18,
    lineHeight: 24,
  },
  /** Figma author row: 16pt top, 20pt sides, 8pt avatar→name */
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SIDE_MARGIN,
    paddingTop: 16,
    gap: 8,
  },
  /** Figma Caption/12px/Medium */
  authorName: {
    flexShrink: 1,
    fontFamily: FONTS.medium,
    fontSize: 12,
    lineHeight: 16,
  },
  content: {
    flex: 1,
  },
  /** Figma: 16pt between author row and inputs, 20pt sides */
  contentContainer: {
    paddingHorizontal: SIDE_MARGIN,
    paddingTop: 16,
    paddingBottom: 24,
  },
  /** Figma "Add Title (Optional)": Body/16px/Bold, 4pt above the body text */
  titleInput: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    lineHeight: 24,
    paddingVertical: 0,
    paddingHorizontal: 0,
    marginBottom: 4,
    includeFontPadding: false,
  },
  /** Figma helper text: Body/14px/Regular */
  contentInput: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    lineHeight: 20,
    minHeight: 120,
    paddingVertical: 0,
    paddingHorizontal: 0,
    textAlignVertical: "top",
    includeFontPadding: false,
  },
  imagePreviewsStack: {
    marginTop: 16,
    gap: 8,
  },
  imagePreviewContainer: {
    overflow: "hidden",
    position: "relative",
  },
  imagePreview: {
    width: "100%",
    height: "100%",
  },
  editImageButton: {
    position: "absolute",
    top: 16,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 24,
    backgroundColor: POST_IMAGE_OVERLAY_BG,
  },
  editImageButtonText: {
    color: POST_IMAGE_OVERLAY_FG,
    fontSize: 14,
    lineHeight: 20,
  },
  removeImageButton: {
    position: "absolute",
    top: 18,
    right: 16,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: POST_IMAGE_OVERLAY_BG,
  },
  /** Figma Bottom Navigation Bar: 12pt top, 20pt sides, 1pt border-0 top (bottom padding set at render) */
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SIDE_MARGIN,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  mediaActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  /** Figma Button-Icon: 32pt tall, 6pt horizontal padding, 20pt icon */
  mediaButton: {
    height: 32,
    paddingHorizontal: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  mediaIcon: {
    width: MEDIA_ICON_SIZE,
    height: MEDIA_ICON_SIZE,
  },
  /** Figma Button: 44pt, 16/10 padding, radius 24 */
  postButton: {
    minWidth: 64,
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 24,
  },
  /** Figma disabled: surface-disabled bg, no 50% fade */
  postButtonDisabled: {
    backgroundColor: POST_DISABLED_BG,
    opacity: 1,
  },
  /** Figma Button/16px: Medium 16/24 */
  postButtonText: {
    fontFamily: FONTS.medium,
    fontSize: 16,
    lineHeight: 24,
  },
  postButtonTextDisabled: {
    color: POST_DISABLED_TEXT,
  },
  uploadProgressContainer: {
    marginTop: 16,
  },
  uploadProgressBar: {
    height: 4,
    borderRadius: 2,
  },
});
