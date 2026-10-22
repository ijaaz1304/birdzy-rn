/**
 * Bird Sound Library — Figma 8291:46157 / 8425:76346 / 8277:23387
 */

import { AppImage } from "@/components/AppImage";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  CreatePlusIcon,
  Images,
  SoundLibraryFilterIcon,
} from "../../../assets";
import { NavBackIcon, Text } from "../../../atoms";
import { FONTS } from "../../../common/typography";
import { APP_COLORS } from "../../../config/colors";
import { HOME_STRINGS } from "../../../config/strings/home.strings";
import { HIT_SLOP } from "../../../constants/uiConstants";
import { FREE_AUDIO_GALLERY_LIMIT } from "../../../constants/appConstants";
import { ConfirmationModal, SearchBar } from "../../../molecules";
import { HomeStackParamList } from "../../../navigation/types";
import { useTheme } from "../../../hooks/useTheme";
import { archetypeService } from "../../../services/archetype/archetype.service";
import type { BirdGalleryAudioFile } from "../../../services/api/features/bird.api.types";
import { soundRecordingService } from "../../../services/audio/soundRecording.service";
import {
  navigateToSoundIdentify,
  navigateToSubscriptionMain,
} from "../../../utils/navigation";
import { spacing } from "../../../design-system/spacing";
import {
  useSubscriptionStore,
  selectIsPremium,
} from "../../subscription/subscription.store";
import {
  AudioGalleryCard,
  clipDisplayName,
  getClipTimestamp,
} from "../components/AudioGalleryCard";
import { RecordingLimitBanner } from "../components/RecordingLimitBanner";

type Nav = NativeStackNavigationProp<HomeStackParamList, "AudioGallery">;
type LibraryTab = "identified" | "unknown";
type SortMode = "newest" | "oldest" | "name";

const strings = HOME_STRINGS.discovery.audioGallery;

export const AudioGalleryScreen: React.FC = () => {
  const theme = useTheme();
  const colors = theme.colors;
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const isPremium = useSubscriptionStore(selectIsPremium);

  const [identified, setIdentified] = useState<BirdGalleryAudioFile[]>([]);
  const [unknown, setUnknown] = useState<BirdGalleryAudioFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<LibraryTab>("identified");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("newest");
  const [pendingDelete, setPendingDelete] = useState<BirdGalleryAudioFile | null>(
    null
  );

  const loadGallery = useCallback(async () => {
    setError(null);
    try {
      const data = await archetypeService.getGalleryAudio();
      setIdentified(data.identified.files ?? []);
      setUnknown(data.unknown.files ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : strings.loadError);
      setIdentified([]);
      setUnknown([]);
    }
  }, []);

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
      setPlayingId(null);
      void soundRecordingService.stopPlayback();
      return;
    }
    setPlayingId(file.fileId);
    try {
      await soundRecordingService.play(file.url, {
        onEnd: () => {
          setPlayingId((current) =>
            current === file.fileId ? null : current
          );
        },
      });
    } catch {
      setPlayingId((current) => (current === file.fileId ? null : current));
    }
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

  const editUnknown = (file: BirdGalleryAudioFile) => {
    const specimenId = file.specimen?.specimenId;
    if (specimenId) {
      openSpecimen(file);
      return;
    }
    navigateToSoundIdentify(navigation);
  };

  const confirmDelete = () => {
    const file = pendingDelete;
    setPendingDelete(null);
    if (!file) return;
    if (playingId === file.fileId) {
      void soundRecordingService.stopPlayback();
      setPlayingId(null);
    }
    setIdentified((prev) => prev.filter((item) => item.fileId !== file.fileId));
    setUnknown((prev) => prev.filter((item) => item.fileId !== file.fileId));
  };

  const showSortSheet = () => {
    const apply = (mode: SortMode) => setSort(mode);
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [
            strings.sortNewest,
            strings.sortOldest,
            strings.sortName,
            strings.cancel,
          ],
          cancelButtonIndex: 3,
          title: strings.sortTitle,
        },
        (index) => {
          if (index === 0) apply("newest");
          else if (index === 1) apply("oldest");
          else if (index === 2) apply("name");
        }
      );
      return;
    }
    Alert.alert(strings.sortTitle, undefined, [
      { text: strings.sortNewest, onPress: () => apply("newest") },
      { text: strings.sortOldest, onPress: () => apply("oldest") },
      { text: strings.sortName, onPress: () => apply("name") },
      { text: strings.cancel, style: "cancel" },
    ]);
  };

  const sourceList = activeTab === "identified" ? identified : unknown;
  const normalizedQuery = query.trim().toLowerCase();
  const isLibraryEmpty = identified.length === 0 && unknown.length === 0;
  const showRecordingLimitBanner =
    !isPremium &&
    !loading &&
    !error &&
    identified.length + unknown.length >= FREE_AUDIO_GALLERY_LIMIT;

  const openRecordingLimitPaywall = useCallback(() => {
    navigateToSubscriptionMain();
  }, []);

  const recordingLimitHeader = showRecordingLimitBanner ? (
    <RecordingLimitBanner onPress={openRecordingLimitPaywall} />
  ) : null;

  const listData = useMemo(() => {
    const filtered = sourceList.filter((item) => {
      if (!normalizedQuery) return true;
      const hay = [
        clipDisplayName(item, activeTab, strings.unknownClip),
        item.specimen?.scientificName,
        item.locationString,
        activeTab === "unknown" ? strings.myRecording : "",
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(normalizedQuery);
    });
    filtered.sort((a, b) => {
      if (sort === "name") {
        return clipDisplayName(a, activeTab, strings.unknownClip).localeCompare(
          clipDisplayName(b, activeTab, strings.unknownClip)
        );
      }
      const delta = getClipTimestamp(a) - getClipTimestamp(b);
      return sort === "oldest" ? delta : -delta;
    });
    return filtered;
  }, [activeTab, normalizedQuery, sort, sourceList]);

  const emptyMessage = isLibraryEmpty
    ? null
    : normalizedQuery
      ? strings.emptySearch
      : activeTab === "identified"
        ? strings.emptyIdentified
        : strings.emptyUnknown;

  const renderEmpty = () => {
    if (loading || error) return null;
    if (isLibraryEmpty) {
      return (
        <View style={styles.emptyWrap}>
          <AppImage
            source={Images.soundLibraryEmptyBird}
            style={styles.emptyArt}
            resizeMode="contain"
          />
          <Text
            variant="body"
            size="medium"
            weight="medium"
            style={[styles.emptyTitle, { color: colors.textPrimary }]}
          >
            {strings.emptyTitle}
          </Text>
          <Text variant="body" size="small" style={styles.emptySubtitle}>
            {strings.emptySubtitle}
          </Text>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigateToSoundIdentify(navigation)}
            style={styles.identifyCta}
          >
            <CreatePlusIcon
              width={24}
              height={24}
              color={APP_COLORS.createButtonFg}
            />
            <Text
              variant="body"
              size="medium"
              weight="medium"
              style={styles.identifyCtaLabel}
            >
              {strings.identifyCta}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <Text variant="body" color="textSecondary" style={styles.tabEmpty}>
        {emptyMessage}
      </Text>
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
            style={[styles.headerTitle, { color: colors.textPrimary }]}
          >
            {strings.title}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchBarWrap}>
            <SearchBar
              value={query}
              onChangeText={setQuery}
              onClear={() => setQuery("")}
              placeholder={strings.searchPlaceholder}
              showFilterButton={false}
              leftIcon="search"
              inputStyle={styles.searchInput}
            />
          </View>
          <TouchableOpacity
            style={[
              styles.filterButton,
              {
                backgroundColor: colors.surfacePrimary,
                borderColor: colors.border0,
              },
            ]}
            onPress={showSortSheet}
            activeOpacity={0.8}
            hitSlop={HIT_SLOP.SMALL}
            accessibilityRole="button"
            accessibilityLabel={strings.sortTitle}
          >
            <SoundLibraryFilterIcon
              width={24}
              height={24}
              color={colors.textPrimary}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.tabs}>
          <LibraryTabButton
            label={`${strings.identified} (${identified.length})`}
            active={activeTab === "identified"}
            onPress={() => setActiveTab("identified")}
          />
          <LibraryTabButton
            label={`${strings.unknown} (${unknown.length})`}
            active={activeTab === "unknown"}
            onPress={() => setActiveTab("unknown")}
          />
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={APP_COLORS.createButtonFg} />
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <Text variant="body" color="textSecondary" style={styles.errorText}>
              {error}
            </Text>
            <TouchableOpacity onPress={() => void loadGallery()}>
              <Text
                variant="body"
                weight="semibold"
                style={{ color: APP_COLORS.createButtonFg }}
              >
                {strings.retry}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={listData}
            keyExtractor={(item) => item.fileId}
            renderItem={({ item }) => (
              <AudioGalleryCard
                item={item}
                variant={activeTab}
                isPlaying={playingId === item.fileId}
                unknownTitle={strings.unknownClip}
                myRecordingLabel={strings.myRecording}
                matchLabel={strings.match}
                matchesLabel={strings.matches}
                onPlay={() => void togglePlay(item)}
                onOpen={
                  activeTab === "identified"
                    ? () => openSpecimen(item)
                    : undefined
                }
                onEdit={
                  activeTab === "unknown" ? () => editUnknown(item) : undefined
                }
                onDelete={
                  activeTab === "unknown"
                    ? () => setPendingDelete(item)
                    : undefined
                }
              />
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            contentContainerStyle={[
              styles.listContent,
              {
                paddingBottom: Math.max(insets.bottom, spacing[8]),
              },
              listData.length === 0 && styles.listEmptyGrow,
            ]}
            ListEmptyComponent={renderEmpty()}
            ListHeaderComponent={recordingLimitHeader}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>

      <ConfirmationModal
        visible={pendingDelete != null}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        title={strings.deleteTitle}
        message={strings.deleteMessage}
        confirmLabel={strings.deleteConfirm}
        cancelLabel={strings.cancel}
        confirmVariant="error"
      />
    </View>
  );
};

const LibraryTabButton: React.FC<{
  label: string;
  active: boolean;
  onPress: () => void;
}> = ({ label, active, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.8}
    style={[
      styles.tab,
      active && {
        borderBottomColor: APP_COLORS.createButtonFg,
      },
    ]}
  >
    <Text
      variant="body"
      size="medium"
      weight={active ? "medium" : "regular"}
      style={{
        fontFamily: active ? FONTS.medium : FONTS.regular,
        fontSize: 16,
        color: active
          ? APP_COLORS.createButtonFg
          : APP_COLORS.textSecondaryGray,
      }}
      numberOfLines={1}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

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
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontFamily: FONTS.bold,
    fontSize: 18,
  },
  headerSpacer: { width: 24 },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[4],
    gap: spacing[2],
    marginTop: spacing[1],
  },
  searchBarWrap: { flex: 1, minWidth: 0 },
  searchInput: {
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tabs: {
    flexDirection: "row",
    marginTop: spacing[3],
    paddingHorizontal: spacing[4],
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[2],
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  listContent: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
  },
  listEmptyGrow: {
    flexGrow: 1,
  },
  separator: { height: spacing[3] },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[8],
    gap: spacing[3],
  },
  emptyArt: {
    width: 219,
    height: 168,
  },
  emptyTitle: {
    fontFamily: FONTS.medium,
    fontSize: 16,
    textAlign: "center",
    marginTop: spacing[1],
  },
  emptySubtitle: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    lineHeight: 20,
    color: APP_COLORS.textSecondaryGray,
    textAlign: "center",
  },
  identifyCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 44,
    paddingHorizontal: spacing[4],
    borderRadius: 24,
    backgroundColor: APP_COLORS.createButtonBg,
    gap: spacing[2],
    marginTop: spacing[2],
  },
  identifyCtaLabel: {
    fontFamily: FONTS.medium,
    fontSize: 16,
    color: APP_COLORS.createButtonFg,
  },
  tabEmpty: {
    textAlign: "center",
    marginTop: spacing[8],
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing[6],
    gap: spacing[4],
  },
  errorText: { textAlign: "center" },
});
