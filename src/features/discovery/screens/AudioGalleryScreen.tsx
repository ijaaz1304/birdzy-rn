/**
 * User audio gallery (GET /core/gallery/audio).
 */

import { AppImage } from "@/components/AppImage";
import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Images } from "../../../assets";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../../hooks/useTheme";
import { Text, NavBackIcon } from "../../../atoms";
import { HomeStackParamList } from "../../../navigation/types";
import { archetypeService } from "../../../services/archetype/archetype.service";
import type { BirdGalleryAudioFile } from "../../../services/api/features/bird.api.types";
import { soundRecordingService } from "../../../services/audio/soundRecording.service";
import { HOME_STRINGS } from "../../../config/strings/home.strings";
import { HIT_SLOP } from "../../../constants/uiConstants";
import { spacing } from "../../../design-system/spacing";
import { Radius } from "../../../design";

type Nav = NativeStackNavigationProp<HomeStackParamList, "AudioGallery">;

type Section = {
  title: string;
  data: BirdGalleryAudioFile[];
};

export const AudioGalleryScreen: React.FC = () => {
  const theme = useTheme();
  const colors = theme.colors;
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const strings = HOME_STRINGS.discovery.audioGallery;

  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const loadGallery = useCallback(async () => {
    setError(null);
    try {
      const data = await archetypeService.getGalleryAudio();
      setSections([
        {
          title: `${strings.identified} (${data.identified.count})`,
          data: data.identified.files ?? [],
        },
        {
          title: `${strings.unknown} (${data.unknown.count})`,
          data: data.unknown.files ?? [],
        },
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : strings.loadError);
      setSections([]);
    }
  }, [strings.identified, strings.loadError, strings.unknown]);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      await loadGallery();
      setLoading(false);
    })();
    return () => {
      void soundRecordingService.stopPlayback();
    };
  }, [loadGallery]);

  const togglePlay = async (file: BirdGalleryAudioFile) => {
    if (playingId === file.fileId) {
      await soundRecordingService.stopPlayback();
      setPlayingId(null);
      return;
    }
    await soundRecordingService.stopPlayback();
    await soundRecordingService.play(file.url);
    setPlayingId(file.fileId);
  };

  const openSpecimen = (file: BirdGalleryAudioFile) => {
    const specimenId = file.specimen?.specimenId;
    if (!specimenId) return;
    navigation.navigate("BirdDetails", {
      mushroomId: specimenId,
      source: "collection",
      idType: "specimen",
      specimenId,
    });
  };

  const renderItem = ({ item }: { item: BirdGalleryAudioFile }) => {
    const isPlaying = playingId === item.fileId;
    const label =
      item.specimen?.commonName ||
      item.specimen?.scientificName ||
      strings.unknownClip;
    return (
      <View
        style={[
          styles.row,
          {
            borderColor: colors.border,
            backgroundColor: colors.surfaceSecondary,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => void togglePlay(item)}
          style={[styles.playBtn, { backgroundColor: colors.primary }]}
          hitSlop={HIT_SLOP.CLOSE}
        >
          <AppImage
            source={isPlaying ? Images.soundRecordStop : Images.soundPlay}
            style={styles.playIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.rowText}
          onPress={() => openSpecimen(item)}
          disabled={!item.specimen?.specimenId}
        >
          <Text
            variant="body"
            size="medium"
            weight="semibold"
            numberOfLines={1}
          >
            {label}
          </Text>
          {item.locationString ? (
            <Text
              variant="caption"
              size="small"
              color="textSecondary"
              numberOfLines={1}
            >
              {item.locationString}
            </Text>
          ) : null}
          {item.resultsCount != null ? (
            <Text variant="caption" size="small" color="textSecondary">
              {item.resultsCount} match{item.resultsCount === 1 ? "" : "es"}
            </Text>
          ) : null}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.surfacePrimary }]}>
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View
          style={[
            styles.header,
            { paddingTop: insets.top > 0 ? 0 : spacing[2] },
          ]}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={HIT_SLOP.CLOSE}
          >
            <NavBackIcon color={colors.textPrimary} size={24} />
          </TouchableOpacity>
          <Text
            variant="headline"
            size="medium"
            weight="bold"
            style={styles.headerTitle}
          >
            {strings.title}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <Text variant="body" color="textSecondary" style={styles.errorText}>
              {error}
            </Text>
            <TouchableOpacity onPress={() => void loadGallery()}>
              <Text variant="body" weight="semibold" color="primary">
                {strings.retry}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.fileId}
            renderItem={renderItem}
            renderSectionHeader={({ section }) => (
              <Text
                variant="body"
                size="small"
                weight="bold"
                style={styles.sectionTitle}
              >
                {section.title}
              </Text>
            )}
            contentContainerStyle={styles.listContent}
            stickySectionHeadersEnabled={false}
            ListEmptyComponent={
              <Text variant="body" color="textSecondary" style={styles.empty}>
                {strings.empty}
              </Text>
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[2],
    gap: spacing[2],
  },
  headerTitle: { flex: 1, textAlign: "center" },
  headerSpacer: { width: 24 },
  listContent: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[8],
  },
  sectionTitle: {
    marginTop: spacing[4],
    marginBottom: spacing[1],
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    padding: spacing[2],
    borderRadius: Radius.md,
    borderWidth: 1,
    marginBottom: spacing[1],
  },
  playBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  playIcon: {
    width: 24,
    height: 24,
  },
  rowText: { flex: 1, gap: 2 },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing[6],
    gap: spacing[4],
  },
  errorText: { textAlign: "center" },
  empty: { textAlign: "center", marginTop: spacing[8] },
});
