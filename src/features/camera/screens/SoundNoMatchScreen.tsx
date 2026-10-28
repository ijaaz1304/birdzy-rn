/**
 * Sound identification — no matches (Figma 8890:125343 / 8890:125344).
 */

import { AppImage } from "@/components/AppImage";
import React, { useCallback, useState } from "react";
import {
  Pressable,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useFocusEffect } from "@react-navigation/native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  DetailsMoreReportDark,
  DetailsMoreReportLight,
  DetailsMoreShareDark,
  DetailsMoreShareLight,
  Images,
} from "../../../assets";
import { Text, NavBackIcon } from "../../../atoms";
import { APP_COLORS } from "../../../config/colors";
import { CAMERA_STRINGS } from "../../../config/strings/camera.strings";
import { FONTS } from "../../../common/typography";
import { Radius } from "../../../design";
import { useTheme, useIsDark } from "../../../hooks/useTheme";
import { useToast } from "../../../hooks/useToast";
import { useBackHandler } from "../../../utils/backHandler";
import { CameraStackParamList } from "../../../navigation/types";
import { FindYourBirdBackground } from "../../bird-personality/components/FindYourBirdBackground";
import { IdentificationLocationBanner } from "../components/IdentificationLocationBanner";
import { SoundSampleCard } from "../components/SoundSampleCard";
import { useLocationToggleFlow } from "../useLocationToggleFlow";
import { shouldShowLocationBannerAsGranted } from "../locationToggle.helpers";
import { useCatalogueCardSound } from "../../catalogue/hooks/useCatalogueCardSound";
import { formatSoundStamp } from "../utils/soundCrop";
import { saveUnknownSoundRecording } from "../utils/saveSoundRecording";
import { canAddAudioGalleryClip } from "../../../services/session/audioGalleryLimit.service";
import { navigateToSubscriptionMain } from "../../../utils/navigation";
import { AddSoundNotePopup } from "../../../molecules/Modal";
import { ReportModal } from "../../../molecules/ReportModal";
import { shareMushroom } from "../../../utils/shareUtils";

const copy = CAMERA_STRINGS.sound;
const noMatchCopy = copy.noMatch;
const LIST_PADDING = 20;

type Route = RouteProp<CameraStackParamList, "SoundNoMatch">;
type Nav = NativeStackNavigationProp<CameraStackParamList, "SoundNoMatch">;

export const SoundNoMatchScreen: React.FC = () => {
  const theme = useTheme();
  const colors = theme.colors;
  const isDark = useIsDark();
  const { showToast } = useToast();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();

  const audioUri = route.params.audioUri;
  const audioDurationSec = route.params.audioDurationSec ?? 0;
  const recordedAt = route.params.recordedAt ?? Date.now();
  const uploadedSoundUrls = route.params.uploadedSoundUrls ?? [];
  const uploadedImageUrls = route.params.uploadedImageUrls ?? [];

  const [showMenu, setShowMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);
  const [savingRecording, setSavingRecording] = useState(false);

  const { playingId, toggleSound } = useCatalogueCardSound();
  const {
    location,
    locationLabel,
    permissionGranted: locationPermissionGranted,
    openCustomLocationSheet,
    syncPermission,
  } = useLocationToggleFlow();

  const showLocationAsGranted = shouldShowLocationBannerAsGranted(
    locationPermissionGranted,
    location
  );
  const soundStamp = formatSoundStamp(new Date(recordedAt));
  const soundPlace =
    showLocationAsGranted && locationLabel?.trim()
      ? locationLabel.trim()
      : copy.noLocation;

  useFocusEffect(
    useCallback(() => {
      void syncPermission();
    }, [syncPermission])
  );

  const handleBack = useCallback(() => {
    navigation.replace("SoundIdentify");
  }, [navigation]);

  useBackHandler({
    enabled: true,
    onBackPress: () => {
      handleBack();
      return true;
    },
    priority: 5,
  });

  const handleTryAgain = useCallback(() => {
    if (!showLocationAsGranted) return;
    navigation.replace("DiagnosisLoading", {
      audioUri,
      audioDurationSec,
      recordedAt,
      cropStartSec: route.params.cropStartSec,
      cropDurationSec: route.params.cropDurationSec,
      identifyMode: "sound",
    });
  }, [
    navigation,
    showLocationAsGranted,
    audioUri,
    audioDurationSec,
    recordedAt,
    route.params.cropStartSec,
    route.params.cropDurationSec,
  ]);

  const handleSaveRecording = useCallback(() => {
    const uploaded =
      uploadedSoundUrls.find(
        (uri) => typeof uri === "string" && /^https?:\/\//i.test(uri.trim())
      ) ?? "";
    if (!uploaded) {
      showToast(
        "The recording could not be saved. Please identify again.",
        "error"
      );
      return;
    }
    setShowAddNote(true);
  }, [uploadedSoundUrls, showToast]);

  const handleNoteContinue = useCallback(
    async (note: string) => {
      if (savingRecording) return;
      const uploaded =
        uploadedSoundUrls.find(
          (uri) => typeof uri === "string" && /^https?:\/\//i.test(uri.trim())
        ) ?? "";
      const imageUrls = uploadedImageUrls.filter((uri) =>
        /^https?:\/\//i.test(uri.trim())
      );
      if (!uploaded || !imageUrls.length) {
        showToast("Could not save this recording.", "error");
        return;
      }
      const allowed = await canAddAudioGalleryClip();
      if (!allowed) {
        navigateToSubscriptionMain();
        return;
      }
      try {
        setSavingRecording(true);
        await saveUnknownSoundRecording({
          uploadedSoundUrl: uploaded,
          note,
          imageUrls,
        });
        setShowAddNote(false);
        showToast(copy.savedToUnknown, "success");
      } catch (error) {
        showToast(
          error instanceof Error
            ? error.message
            : "Could not save this recording.",
          "error"
        );
      } finally {
        setSavingRecording(false);
      }
    },
    [savingRecording, uploadedSoundUrls, uploadedImageUrls, showToast]
  );

  const handleShare = useCallback(async () => {
    setShowMenu(false);
    try {
      await shareMushroom("Bird recording", undefined, uploadedImageUrls[0]);
    } catch {
      showToast("Failed to open share", "error");
    }
  }, [uploadedImageUrls, showToast]);

  return (
    <>
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <FindYourBirdBackground />
        <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
          <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
          <View style={styles.header}>
            <TouchableOpacity
              onPress={handleBack}
              style={styles.headerIcon}
              activeOpacity={0.7}
            >
              <NavBackIcon color={colors.textPrimary} />
            </TouchableOpacity>
            <View style={styles.headerSpacer} />
            <TouchableOpacity
              onPress={() => setShowMenu((open) => !open)}
              style={styles.headerIcon}
              activeOpacity={0.7}
              accessibilityLabel="More options"
            >
              <MaterialIcons
                name="more-horiz"
                size={24}
                color={colors.textPrimary}
              />
            </TouchableOpacity>
          </View>

          {showMenu ? (
            <View
              style={[StyleSheet.absoluteFillObject, styles.menuOverlay]}
              pointerEvents="box-none"
            >
              <Pressable
                style={StyleSheet.absoluteFillObject}
                onPress={() => setShowMenu(false)}
              />
              <View
                style={[
                  styles.menu,
                  {
                    backgroundColor: isDark
                      ? colors.surfacePrimary
                      : APP_COLORS.surfaceWhite,
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    void handleShare();
                  }}
                >
                  {isDark ? (
                    <DetailsMoreShareDark width={20} height={20} />
                  ) : (
                    <DetailsMoreShareLight width={20} height={20} />
                  )}
                  <Text
                    style={[
                      styles.menuItemLabel,
                      { color: colors.textPrimary },
                    ]}
                  >
                    Share
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setShowMenu(false);
                    setShowReportModal(true);
                  }}
                >
                  {isDark ? (
                    <DetailsMoreReportDark width={20} height={20} />
                  ) : (
                    <DetailsMoreReportLight width={20} height={20} />
                  )}
                  <Text
                    style={[
                      styles.menuItemLabel,
                      { color: colors.textPrimary },
                    ]}
                  >
                    Report
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          <View style={styles.content}>
            {audioUri ? (
              <SoundSampleCard
                durationSec={audioDurationSec}
                stamp={soundStamp}
                place={soundPlace}
                birdCount={0}
                audioUri={audioUri}
                isPlaying={playingId === "user-recording"}
                onTogglePlay={() => {
                  void toggleSound("user-recording", [audioUri]);
                }}
              />
            ) : null}

            {!showLocationAsGranted ? (
              <IdentificationLocationBanner
                variant="results"
                permissionGranted={false}
                locationLabel={locationLabel}
                prompt={noMatchCopy.enableLocationPrompt}
                onToggleLocation={(enabled) => {
                  if (enabled) openCustomLocationSheet();
                }}
                onPressLocation={openCustomLocationSheet}
              />
            ) : locationLabel?.trim() ? (
              <View
                style={[
                  styles.locationCard,
                  { backgroundColor: colors.surfaceSecondary },
                ]}
              >
                <Text
                  style={[styles.locationText, { color: colors.textPrimary }]}
                >
                  {copy.locationSpottedPrefix}
                  <Text
                    style={styles.locationLink}
                    onPress={() => openCustomLocationSheet()}
                  >
                    {locationLabel.trim()}
                  </Text>
                </Text>
              </View>
            ) : null}

            <View style={styles.emptyWrap}>
              <AppImage
                source={Images.soundLibraryEmptyBird}
                style={styles.emptyArt}
                resizeMode="contain"
              />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                {noMatchCopy.title}
              </Text>
              <Text style={[styles.emptyBody, { color: colors.textSecondary }]}>
                {showLocationAsGranted
                  ? noMatchCopy.bodyWithLocation
                  : noMatchCopy.bodyNoLocation}
              </Text>
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              onPress={handleTryAgain}
              disabled={!showLocationAsGranted}
              activeOpacity={0.85}
              style={[
                styles.primaryBtn,
                {
                  backgroundColor: showLocationAsGranted
                    ? colors.primaryCTA
                    : colors.borderSecondary,
                },
              ]}
            >
              <Text
                style={[
                  styles.primaryBtnLabel,
                  {
                    color: showLocationAsGranted
                      ? "#FFFFFF"
                      : colors.textTertiary,
                  },
                ]}
              >
                {noMatchCopy.tryAgain}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                void handleSaveRecording();
              }}
              activeOpacity={0.85}
              style={[
                styles.secondaryBtn,
                {
                  borderColor: colors.border0,
                  backgroundColor: colors.surfacePrimary,
                },
              ]}
            >
              <Text
                style={[
                  styles.secondaryBtnLabel,
                  { color: colors.textPrimary },
                ]}
              >
                {noMatchCopy.saveRecording}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      <ReportModal
        visible={showReportModal}
        variant="mushroom"
        title={copy.reportTitle}
        description={copy.reportDescription}
        onClose={() => setShowReportModal(false)}
        onSubmit={async () => {
          setShowReportModal(false);
          showToast(copy.reportSent, "success");
        }}
      />
      <AddSoundNotePopup
        visible={showAddNote}
        busy={savingRecording}
        onClose={() => {
          if (!savingRecording) setShowAddNote(false);
        }}
        onContinue={(note) => {
          void handleNoteContinue(note);
        }}
      />
    </>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: "hidden",
  },
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 52,
  },
  headerIcon: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerSpacer: {
    flex: 1,
  },
  menuOverlay: {
    zIndex: 20,
  },
  menu: {
    position: "absolute",
    top: 52,
    right: 12,
    minWidth: 180,
    borderRadius: Radius.md,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  menuItemLabel: {
    fontFamily: FONTS.medium,
    fontSize: 16,
    marginLeft: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: LIST_PADDING,
    paddingTop: 8,
    gap: 16,
  },
  locationCard: {
    borderRadius: Radius.sm,
    padding: 12,
  },
  locationText: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  locationLink: {
    color: "#007AFF",
    textDecorationLine: "underline",
  },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingBottom: 24,
  },
  emptyArt: {
    width: 219,
    height: 168,
  },
  emptyTitle: {
    fontFamily: FONTS.medium,
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
  },
  emptyBody: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  footer: {
    paddingHorizontal: LIST_PADDING,
    paddingTop: 12,
    paddingBottom: 12,
    gap: 8,
  },
  primaryBtn: {
    height: 44,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnLabel: {
    fontFamily: FONTS.medium,
    fontSize: 16,
    lineHeight: 24,
  },
  secondaryBtn: {
    height: 44,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnLabel: {
    fontFamily: FONTS.medium,
    fontSize: 16,
    lineHeight: 24,
  },
});
