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
import type { NavigationProp } from "@react-navigation/native";
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
import { HomeStackParamList, MainTabParamList } from "../../../navigation/types";
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
import {
  AudioGalleryCardMenu,
  type CardMenuAnchor,
} from "../components/AudioGalleryCardMenu";
import { RecordingLimitBanner } from "../components/RecordingLimitBanner";

type Nav = NativeStackNavigationProp<HomeStackParamList, "AudioGallery">;
type LibraryTab = "identified" | "unknown";
type SortMode = "newest" | "oldest" | "name";

const strings = HOME_STRINGS.discovery.audioGallery;

export const AudioGalleryScreen: React.FC = () => {
  const theme = useTheme();
  const colors = theme.colors;
  const isDark = theme.mode === "dark";
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
  const [cardMenu, setCardMenu] = useState<{
    item: BirdGalleryAudioFile;
    anchor: CardMenuAnchor;
  } | null>(null);
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

  const openPossibleMatches = (file: BirdGalleryAudioFile) => {
    if (!file.url?.trim()) return;
    if (playingId === file.fileId) {
      void soundRecordingService.stopPlayback();
      setPlayingId(null);
    }
    const recordedAt =
      Date.parse(file.createdAt || file.capturedAt || "") || Date.now();
    navigation
      .getParent<NavigationProp<MainTabParamList>>()
      ?.navigate("Camera", {
        screen: "DiagnosisLoading",
        params: {
          audioUri: file.url,
          audioDurationSec: 0,
          recordedAt,
          identifyMode: "sound",
        },
      });
  };

  const editUnknown = (file: BirdGalleryAudioFile) => {
    const specimenId = file.specimen?.specimenId;
    if (specimenId) {
      navigation.navigate("BirdDetails", {
        mushroomId: specimenId,
        source: "collection",
        idType: "specimen",
        specimenId,
      });
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
      const ctaFg = isDark ? EMPTY_DARK.ctaFg : APP_COLORS.createButtonFg;
      // Figma 9380:111759: art, then 22 to the text, 8 title→subtitle, 12 to the button.
      return (
        <View style={styles.emptyWrap}>
          <View style={styles.emptyArtFrame}>
            <AppImage
              source={Images.soundLibraryEmptyBird}
              style={styles.emptyArt}
              resizeMode="contain"
            />
          </View>
          <View style={styles.emptyBody}>
            <View style={styles.emptyText}>
              <Text
                variant="body"
                size="medium"
                weight="medium"
                style={[styles.emptyTitle, { color: colors.textPrimary }]}
              >
                {strings.emptyTitle}
              </Text>
              <Text
                variant="body"
                size="small"
                style={[
                  styles.emptySubtitle,
                  isDark && { color: EMPTY_DARK.subtitle },
                ]}
              >
                {strings.emptySubtitle}
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => navigateToSoundIdentify(navigation)}
              style={[
                styles.identifyCta,
                isDark && styles.identifyCtaDark,
              ]}
              accessibilityRole="button"
              accessibilityLabel={strings.identifyCta}
            >
              <CreatePlusIcon width={24} height={24} color={ctaFg} />
              <Text
                variant="body"
                size="medium"
                weight="medium"
                style={[styles.identifyCtaLabel, { color: ctaFg }]}
              >
                {strings.identifyCta}
              </Text>
            </TouchableOpacity>
          </View>
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
              // Figma dark search field: Surface-Secondary #091421 (border stays Border-0 #333).
              containerStyle={isDark ? styles.searchDark : undefined}
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
            isDark={isDark}
            onPress={() => setActiveTab("identified")}
          />
          <LibraryTabButton
            label={`${strings.unknown} (${unknown.length})`}
            active={activeTab === "unknown"}
            isDark={isDark}
            onPress={() => setActiveTab("unknown")}
          />
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator
              size="large"
              color={isDark ? colors.primaryCTA : APP_COLORS.createButtonFg}
            />
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
                onOpen={() => openPossibleMatches(item)}
                onEdit={
                  activeTab === "unknown" ? () => editUnknown(item) : undefined
                }
                onDelete={
                  activeTab === "unknown"
                    ? () => setPendingDelete(item)
                    : undefined
                }
                onLongPress={
                  activeTab === "unknown"
                    ? (anchor) => setCardMenu({ item, anchor })
                    : undefined
                }
                highlighted={cardMenu?.item.fileId === item.fileId}
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

      <AudioGalleryCardMenu
        anchor={cardMenu?.anchor ?? null}
        renameLabel={strings.menuRename}
        deleteLabel={strings.menuDelete}
        onClose={() => setCardMenu(null)}
        onRename={() => {
          if (cardMenu) editUnknown(cardMenu.item);
        }}
        onDelete={() => {
          if (cardMenu) setPendingDelete(cardMenu.item);
        }}
      />

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

/**
 * Figma 9380:111746 (dark empty library): subtitle Text & icon-Secondary #D1D1D1;
 * "Identify by Sound" Text & icon-Brand 1 #16B6B4 on Surface-brand-1 Accent #072C38.
 */
const EMPTY_DARK = {
  subtitle: "#D1D1D1",
  ctaFg: "#16B6B4",
  ctaBg: "#072C38",
} as const;

/** Figma 9380:111730 (dark): active tab #009DA7 text + 2px underline, inactive #D1D1D1. */
const TAB_DARK = { active: "#009DA7", inactive: "#D1D1D1" } as const;

const LibraryTabButton: React.FC<{
  label: string;
  active: boolean;
  isDark: boolean;
  onPress: () => void;
}> = ({ label, active, isDark, onPress }) => {
  const activeColor = isDark ? TAB_DARK.active : APP_COLORS.createButtonFg;
  const inactiveColor = isDark
    ? TAB_DARK.inactive
    : APP_COLORS.textSecondaryGray;
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.tab, active && { borderBottomColor: activeColor }]}
    >
      <Text
        variant="body"
        size="medium"
        weight={active ? "medium" : "regular"}
        style={[
          active ? styles.tabLabelActive : styles.tabLabel,
          { color: active ? activeColor : inactiveColor },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </TouchableOpacity>
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
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontFamily: FONTS.bold,
    fontSize: 18,
  },
  headerSpacer: { width: 24 },
  // Figma body: px20, pt8; search row gap 8.
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[5],
    gap: spacing[2],
    marginTop: spacing[2],
  },
  searchBarWrap: { flex: 1, minWidth: 0 },
  searchInput: {
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
  searchDark: {
    backgroundColor: "#091421",
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  // Figma: 24 between search and tabs; tab 32 high, px12; label Body/16 Medium (active) / Regular.
  tabs: {
    flexDirection: "row",
    marginTop: spacing[6],
    paddingHorizontal: spacing[5],
  },
  tab: {
    flex: 1,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing[3],
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabLabel: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: -0.16,
  },
  tabLabelActive: {
    fontFamily: FONTS.medium,
    fontSize: 16,
    lineHeight: 24,
  },
  // Figma: 16 below tabs, cards gap 12, px20.
  listContent: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
  },
  listEmptyGrow: {
    flexGrow: 1,
  },
  separator: { height: spacing[3] },
  // Figma: block starts 24 below the tabs (list pt16 + 8), 295 wide (px20 + list px20).
  emptyWrap: {
    alignItems: "center",
    paddingTop: spacing[2],
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[8],
    gap: 22,
  },
  // Figma 9380:111760: 219×168 frame clips a 185×185 bird placed at (17, 6).
  emptyArtFrame: {
    width: 219,
    height: 168,
    overflow: "hidden",
  },
  emptyArt: {
    position: "absolute",
    left: 17,
    top: 6,
    width: 185,
    height: 185,
  },
  emptyBody: {
    alignSelf: "stretch",
    alignItems: "center",
    gap: spacing[3],
  },
  emptyText: {
    alignSelf: "stretch",
    gap: spacing[2],
  },
  emptyTitle: {
    fontFamily: FONTS.medium,
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
  },
  emptySubtitle: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    lineHeight: 20,
    color: APP_COLORS.textSecondaryGray,
    textAlign: "center",
  },
  // Figma Button: 44 high, px16, gap 8, radius ~24, drop shadow #313131 28% (0,4) blur 5.
  identifyCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    paddingVertical: 10,
    paddingHorizontal: spacing[4],
    borderRadius: 24,
    backgroundColor: APP_COLORS.createButtonBg,
    gap: spacing[2],
  },
  identifyCtaDark: {
    backgroundColor: EMPTY_DARK.ctaBg,
    shadowColor: "#313131",
    shadowOpacity: 0.28,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 5,
    elevation: 4,
  },
  identifyCtaLabel: {
    fontFamily: FONTS.medium,
    fontSize: 16,
    lineHeight: 24,
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
