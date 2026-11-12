/**
 * Feed Screen - All posts / My posts
 * Dynamic component with Firestore real-time integration
 */

import { AppImage } from "@/components/AppImage";
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme, useIsDark } from "../../../hooks/useTheme";
import { useToast } from "../../../hooks/useToast";
import { Text } from "../../../atoms";
import { FONTS } from "../../../common/typography";
import { FloatingActionButton } from "../../../atoms";
import { Icon } from "../../../atoms";
import { Tab } from "../../../molecules";
import { ScreenContainer } from "../../../molecules";
import { EmptyState } from "../../../molecules";
import {
  ReportModal,
  REPORT_MODAL_KEYBOARD_COOLDOWN_MS,
} from "../../../molecules/ReportModal";
import { MODAL_STRINGS } from "../../../config/strings/modals.strings";
import { FeedStackParamList } from "../../../navigation/types";
// Post type - should come from API types
type Post = any;
import { FeedConfig } from "../config/feedConfig.types";
import { commonFeedStyles } from "../styles/commonStyles";
import { feedService } from "../../../services/firebase";
import { useAuthStore } from "../../../features/auth/auth.store";
import {
  analyticsService,
  EVENTS,
} from "../../../services/analytics/analytics.service";
import { FLATLIST_CONFIG } from "../../../constants/appConstants";
import { FEED_COLORS } from "../../../constants/colorConstants";
import { APP_COLORS } from "../../../config/colors";

/** Header + tabs + soft gradient fade below tabs (status bar added at runtime). */
const FEED_HEADER_BG_BODY_HEIGHT = 148;
import {
  Images,
  NotificationFeed,
  NotificationFeedDark,
} from "../../../assets";
import { FeedCard } from "../components/FeedCard";
import { PostActionSheet } from "../components/PostActionSheet";
import { DeletePostPopup } from "../components/DeletePostPopup";
import { CommunityRulesModal } from "../components/CommunityRulesModal";
import { AppSheet } from "../../../components/AppSheet/AppSheet";
import {
  useSubscriptionStore,
  selectIsPremium,
} from "../../../features/subscription/subscription.store";
import { navigateToSubscriptionMain } from "../../../utils/navigation";
import { hasReachedFreeFeedPostLimit } from "../freeFeedPostLimit";

type FeedScreenNavigationProp = NativeStackNavigationProp<
  FeedStackParamList,
  "FeedMain"
>;

export interface FeedScreenProps {
  config: FeedConfig;
  onPostPress?: (postId: string) => void;
  onNotificationPress?: () => void;
}

// PostCard replaced by FeedCard component

export const FeedScreen: React.FC<FeedScreenProps> = ({
  config,
  onPostPress,
  onNotificationPress,
}) => {
  const theme = useTheme();
  const isDark = useIsDark();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<FeedScreenNavigationProp>();
  const { user } = useAuthStore();
  const isPremium = useSubscriptionStore(selectIsPremium);
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<"all" | "mine">("all");
  const [posts, setPosts] = useState<Post[]>([]);
  const [excludedPostIds, setExcludedPostIds] = useState<Set<string>>(
    new Set()
  );
  const [loading, setLoading] = useState(true);
  /** Pull-to-refresh: separate from initial load so Firestore listener re-fetch isn't required */
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRulesSheet, setShowRulesSheet] = useState(false);
  const [_communityRulesAgreed, setCommunityRulesAgreed] = useState<
    boolean | null
  >(null);
  const [reportPostId, setReportPostId] = useState<string | null>(null);
  const [optionsPost, setOptionsPost] = useState<Post | null>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [showReportSheet, setShowReportSheet] = useState(false);
  const [reportKeyboardCooldown, setReportKeyboardCooldown] = useState(false);
  const [actionSheetAnchorTop, setActionSheetAnchorTop] = useState<
    number | undefined
  >(undefined);
  const [showUnlimitedSheet, setShowUnlimitedSheet] = useState(false);

  // Time spent on feed: log on blur
  const feedEnterTimeRef = useRef<number>(0);
  useFocusEffect(
    useCallback(() => {
      feedEnterTimeRef.current = Date.now();
      return () => {
        const durationSeconds = Math.round(
          (Date.now() - feedEnterTimeRef.current) / 1000
        );
        if (durationSeconds > 0) {
          analyticsService.logEvent(EVENTS.time_spent_feed, {
            duration_seconds: String(durationSeconds),
          });
        }
      };
    }, [])
  );

  // Posts the user hid or reported — filtered from All tab (own posts always kept).
  useEffect(() => {
    if (!user?.id) {
      setExcludedPostIds(new Set());
      return;
    }
    const unsub = feedService.subscribeToFeedExcludedPostIds(
      user.id,
      setExcludedPostIds
    );
    return unsub;
  }, [user?.id]);

  // Feed notifications listener lives in FeedStack (FeedNotificationsSync) so it runs on NotificationCenter too.

  // Subscribe to community rules agreed (is_agreed) per user – show sheet if not yet agreed
  useEffect(() => {
    if (!user?.id) {
      setCommunityRulesAgreed(null);
      return;
    }
    const unsub = feedService.subscribeToCommunityRulesAgreed(
      user.id,
      (isAgreed) => {
        setCommunityRulesAgreed(isAgreed);
      }
    );
    return unsub;
  }, [user?.id]);

  // Community rules sheet only when user taps info button (not auto-shown)

  // Subscribe to posts based on active tab; timeout so loader doesn't run forever if Firebase doesn't respond
  useEffect(() => {
    if (!user?.id) {
      setPosts([]);
      setLoading(false);
      setError(null);
      return;
    }

    let unsubscribe: (() => void) | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const LOAD_TIMEOUT_MS = 12000;

    const onFeedError = (err: Error) => {
      setPosts([]);
      setLoading(false);
      setError(err?.message || "Unable to load feed");
    };

    const clearTimeoutRef = () => {
      if (timeoutId != null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };

    timeoutId = setTimeout(() => {
      timeoutId = null;
      setLoading((prev) => {
        if (prev) {
          setError(null);
          return false;
        }
        return prev;
      });
    }, LOAD_TIMEOUT_MS);

    if (activeTab === "all") {
      try {
        unsubscribe = feedService.subscribeToPosts(
          (fetchedPosts) => {
            clearTimeoutRef();
            setPosts(fetchedPosts || []);
            setLoading(false);
            setError(null);
          },
          user.id,
          onFeedError
        );
      } catch (e) {
        clearTimeoutRef();
        onFeedError(e instanceof Error ? e : new Error("Feed failed to start"));
      }
    } else {
      try {
        unsubscribe = feedService.subscribeToUserPosts(
          user.id,
          (fetchedPosts) => {
            clearTimeoutRef();
            setPosts(fetchedPosts || []);
            setLoading(false);
            setError(null);
          },
          user.id,
          onFeedError
        );
      } catch (e) {
        clearTimeoutRef();
        onFeedError(e instanceof Error ? e : new Error("Feed failed to start"));
      }
    }

    analyticsService.logEvent(EVENTS.screen_view, {
      screen_name: "Feed",
      source: activeTab,
    });

    return () => {
      clearTimeoutRef();
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [activeTab, user?.id]);

  const visiblePosts = useMemo(
    () =>
      posts.filter((p) => p.userId === user?.id || !excludedPostIds.has(p.id)),
    [posts, excludedPostIds, user?.id]
  );

  const handlePostPress = useCallback(
    (postId: string) => {
      if (onPostPress) {
        onPostPress(postId);
      } else {
        navigation.navigate("PostDetails", { postId });
      }

      analyticsService.logEvent(EVENTS.post_viewed, { post_id: postId });
    },
    [onPostPress, navigation]
  );

  const handleLike = useCallback(
    async (postId: string) => {
      if (!user?.id) return;
      try {
        await feedService.toggleLike(
          postId,
          user.id,
          user.name || user.email || "Someone"
        );
      } catch (e) {
        console.error("Error toggling like:", e);
      }
    },
    [user?.id, user?.name, user?.email]
  );

  const handleComment = useCallback(
    (postId: string) => {
      analyticsService.logEvent(EVENTS.feed_comment, { post_id: postId });
      navigation.navigate("PostDetails", { postId });
    },
    [navigation]
  );

  const handlePostOptions = useCallback((item: Post, anchorTop?: number) => {
    setOptionsPost(item);
    setActionSheetAnchorTop(anchorTop);
    setShowActionSheet(true);
  }, []);

  const handleDeletePost = useCallback(async () => {
    if (!user?.id || !optionsPost) return;
    setShowDeletePopup(false);
    setShowActionSheet(false);
    try {
      await feedService.deletePost(optionsPost.id, user.id);
      showToast("Post deleted", "success");
      setOptionsPost(null);
    } catch (e) {
      console.error("Delete failed", e);
      showToast("Could not delete post", "error");
    }
  }, [user?.id, optionsPost, showToast]);

  const addExcludedPostLocally = useCallback((postId: string) => {
    setExcludedPostIds((prev) => {
      if (prev.has(postId)) return prev;
      return new Set([...prev, postId]);
    });
  }, []);

  const handleHidePost = useCallback(async () => {
    if (!user?.id || !optionsPost) return;
    const postId = optionsPost.id;
    setShowActionSheet(false);
    addExcludedPostLocally(postId);
    try {
      await feedService.hidePost(user.id, postId);
      showToast("Post hidden from your feed", "success");
      setOptionsPost(null);
    } catch (e) {
      console.error("Hide post failed", e);
      showToast("Could not hide post", "error");
    }
  }, [addExcludedPostLocally, user?.id, optionsPost, showToast]);

  const handleEditPost = useCallback(() => {
    if (!optionsPost) return;
    setShowActionSheet(false);
    navigation.navigate("CreatePost", { postId: optionsPost.id });
    setOptionsPost(null);
  }, [optionsPost, navigation]);

  const handleCreatePress = useCallback(async () => {
    if (!isPremium && user?.id) {
      const atLimit = await hasReachedFreeFeedPostLimit(user.id);
      if (atLimit) {
        setShowUnlimitedSheet(true);
        return;
      }
    }
    navigation.navigate("CreatePost");
  }, [isPremium, user?.id, navigation]);

  const closeReportSheet = useCallback(() => {
    setShowReportSheet(false);
    setReportPostId(null);
    setOptionsPost(null);
    setReportKeyboardCooldown(true);
    setTimeout(
      () => setReportKeyboardCooldown(false),
      REPORT_MODAL_KEYBOARD_COOLDOWN_MS
    );
  }, []);

  const handleReportSubmit = useCallback(
    async (message: string) => {
      const postId = reportPostId ?? optionsPost?.id;
      if (!user?.id || !postId) return;
      setTimeout(() => {
        addExcludedPostLocally(postId);
      }, 320);
      try {
        await feedService.reportPost(user.id, postId, message);
        showToast(MODAL_STRINGS.modals.reportPost.successMessage, "success");
      } catch (e) {
        console.error("Report failed", e);
        showToast("Could not submit report", "error");
      }
    },
    [addExcludedPostLocally, user?.id, reportPostId, optionsPost?.id, showToast]
  );

  const listData = activeTab === "all" ? visiblePosts : posts;

  const renderItem = useCallback(
    ({ item, index }: { item: Post; index: number }) => (
      <FeedCard
        userName={item.userName}
        userAvatar={item.userAvatar}
        timestamp={item.timestamp}
        title={item.title}
        content={item.content || item.caption}
        image={item.image}
        itemName={item.itemName}
        likes={item.likes || 0}
        comments={item.comments || 0}
        shares={item.shares}
        isLiked={!!item.isLiked}
        showItemName={!!config.postCard.itemNameLabel}
        onPress={() => handlePostPress(item.id)}
        onLike={() => handleLike(item.id)}
        onComment={() => handleComment(item.id)}
        onShare={async () => {
          const { sharePost } = require("../../../utils/shareUtils");
          await sharePost(item.id, item.content || "", item.image);
        }}
        onOptions={(anchorTop) => handlePostOptions(item, anchorTop)}
        style={{
          marginBottom: index === listData.length - 1 ? 0 : 16,
        }}
      />
    ),
    [
      listData.length,
      config,
      user?.id,
      handlePostPress,
      handleLike,
      handleComment,
      handlePostOptions,
    ]
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    // Real-time listener may not emit if data unchanged; always clear the spinner.
    setTimeout(() => setRefreshing(false), 900);
  }, []);

  const handleTabChange = (tab: "all" | "mine") => {
    setActiveTab(tab);
    analyticsService.logEvent(EVENTS.feed_tab_changed, { tab });
  };

  const emptyState =
    activeTab === "mine"
      ? config.emptyStates.noMyPosts
      : config.emptyStates.noPosts;

  const feedHeaderImage = Images.commonBg;

  const emptyFeedImage = Images.emptyFeed;
  /**
   * Responsive empty state: Figma 173×152 illustration, never wider than 60% of the
   * screen, placed ~14% of the screen height below the tabs (Figma: 113pt on 812pt).
   */
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const emptyImageWidth = Math.min(
    EMPTY_IMAGE_WIDTH,
    Math.round(windowWidth * 0.6)
  );
  const emptyImageHeight = Math.round(
    (emptyImageWidth * EMPTY_IMAGE_HEIGHT) / EMPTY_IMAGE_WIDTH
  );
  const emptyTopOffset = Math.round(windowHeight * EMPTY_TOP_RATIO);

  /** Figma 8025:83763 — header art fades into surface-primary (white), no grey band */
  const feedBackgroundFill =
    theme.mode === "dark"
      ? FEED_COLORS.BACKGROUND_FILL_DARK
      : theme.colors.surfacePrimary;

  const feedHeaderBgHeight = insets.top + FEED_HEADER_BG_BODY_HEIGHT;

  // Show error state when feed failed (e.g. Firebase not available); no full-screen loader
  if (error) {
    return (
      <ScreenContainer showBackground={false}>
        <View style={commonFeedStyles.header}>
          <Text
            variant="title"
            size="large"
            weight="bold"
            style={commonFeedStyles.headerTitle}
          >
            {config.screenTitle}
          </Text>
        </View>
        <EmptyState
          image={emptyFeedImage}
          title="Unable to load feed"
          subtitle={error}
        />
      </ScreenContainer>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          flex: 1,
          backgroundColor: feedBackgroundFill,
        },
        reportKeyboardCooldown && styles.reportKeyboardSettled,
      ]}
    >
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={isDark ? "light-content" : "dark-content"}
      />
      <View
        style={[styles.headerBgClip, { height: feedHeaderBgHeight }]}
        pointerEvents="none"
      >
        <AppImage
          source={feedHeaderImage}
          style={styles.headerBgImage}
          resizeMode="stretch"
        />
      </View>

      <View style={styles.content}>
        {/* Header - paddingTop so content sits below status bar while image extends behind it */}
        <View
          style={[
            commonFeedStyles.header,
            {
              justifyContent: "space-between",
              borderBottomWidth: 0,
              paddingTop: insets.top + 12,
              paddingBottom: 12,
              paddingRight: 12,
            },
          ]}
        >
          <Text
            variant="title"
            size="large"
            weight="bold"
            numberOfLines={1}
            style={[
              commonFeedStyles.headerTitle,
              styles.headerTitle,
              { color: isDark ? theme.colors.text : FEED_TITLE_COLOR_LIGHT },
            ]}
          >
            {config.screenTitle}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <TouchableOpacity
              onPress={
                onNotificationPress ||
                (() => navigation.navigate("NotificationCenter"))
              }
              activeOpacity={0.8}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {isDark ? (
                <NotificationFeedDark width={24} height={24} />
              ) : (
                <NotificationFeed width={24} height={24} />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowRulesSheet(true)}
              activeOpacity={0.8}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Icon name="info" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs - no line below */}
        <View style={[commonFeedStyles.tabs, { borderBottomWidth: 0 }]}>
          <View style={{ flex: 1 }}>
            <Tab
              label={config.tabs.all}
              active={activeTab === "all"}
              onPress={() => handleTabChange("all")}
              variant="underline"
              activeColor={APP_COLORS.ctaPrimary}
              underlineColor={APP_COLORS.ctaPrimary}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Tab
              label={config.tabs.mine}
              active={activeTab === "mine"}
              onPress={() => handleTabChange("mine")}
              variant="underline"
              activeColor={APP_COLORS.ctaPrimary}
              underlineColor={APP_COLORS.ctaPrimary}
            />
          </View>
        </View>

        {/* Feed List */}
        <FlatList
          data={listData}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            commonFeedStyles.list,
            { paddingBottom: 52 },
            listData.length === 0 && { flexGrow: 1 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing && !!user?.id}
          onRefresh={handleRefresh}
          renderItem={renderItem}
          ListEmptyComponent={
            !loading ? (
              <View style={[styles.emptyWrap, { paddingTop: emptyTopOffset }]}>
                <View style={styles.emptyBlock}>
                  <AppImage
                    source={emptyFeedImage}
                    style={{ width: emptyImageWidth, height: emptyImageHeight }}
                    resizeMode="contain"
                  />
                  <Text
                    numberOfLines={2}
                    style={[
                      styles.emptyTitle,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {emptyState.title}
                  </Text>
                  {/* "My posts" (Figma) is a single line; "All" keeps its call-to-action subtitle */}
                  {activeTab !== "mine" && emptyState.subtitle ? (
                    <Text
                      style={[
                        styles.emptySubtitle,
                        { color: theme.colors.textTertiary },
                      ]}
                    >
                      {emptyState.subtitle}
                    </Text>
                  ) : null}
                </View>
              </View>
            ) : null
          }
          initialNumToRender={FLATLIST_CONFIG.INITIAL_NUM_TO_RENDER}
          maxToRenderPerBatch={FLATLIST_CONFIG.MAX_TO_RENDER_PER_BATCH}
          windowSize={FLATLIST_CONFIG.WINDOW_SIZE}
          removeClippedSubviews={FLATLIST_CONFIG.REMOVE_CLIPPED_SUBVIEWS}
          updateCellsBatchingPeriod={
            FLATLIST_CONFIG.UPDATE_CELLS_BATCHING_PERIOD
          }
        />
      </View>

      {/* Floating Action Button */}
      <FloatingActionButton
        icon="plus"
        label="Create"
        position="bottom-right"
        variant="feed"
        size="medium"
        onPress={handleCreatePress}
        /* Figma: 12pt above the bottom tab bar, 16pt from the right edge */
        bottomOffset={12}
        rightOffset={16}
      />

      {/* Post Action Sheet */}
      <PostActionSheet
        visible={showActionSheet}
        isMyPost={!!optionsPost?.isMyPost}
        showOptionIcons={false}
        onEdit={handleEditPost}
        onDelete={() => {
          setShowActionSheet(false);
          setShowDeletePopup(true);
        }}
        onHide={handleHidePost}
        onReport={() => {
          setShowActionSheet(false);
          if (optionsPost?.id) {
            setReportPostId(optionsPost.id);
          }
          setShowReportSheet(true);
        }}
        onClose={() => {
          setShowActionSheet(false);
          setOptionsPost(null);
        }}
        anchorTop={actionSheetAnchorTop}
      />

      {/* Delete Post Popup */}
      <DeletePostPopup
        visible={showDeletePopup}
        onConfirm={handleDeletePost}
        onCancel={() => setShowDeletePopup(false)}
      />

      {/* Report Popup */}
      <ReportModal
        visible={showReportSheet}
        variant="post"
        onSubmit={handleReportSubmit}
        onClose={closeReportSheet}
      />

      <CommunityRulesModal
        visible={showRulesSheet}
        onClose={() => setShowRulesSheet(false)}
        config={config}
        onAgree={async () => {
          if (!user?.id) return;
          analyticsService.logEvent(EVENTS.community_rules_agreed, {
            user_id: user.id,
          });
          try {
            await feedService.setCommunityRulesAgreed(user.id);
            setShowRulesSheet(false);
          } catch (e) {
            setShowRulesSheet(false);
            if (__DEV__) {
              console.error("Failed to save community rules agreed:", e);
            }
          }
        }}
      />

      <AppSheet
        visible={showUnlimitedSheet}
        onClose={() => setShowUnlimitedSheet(false)}
        type="limitReached"
        payload={{
          limitType: "feed",
          onUpgrade: () => {
            setShowUnlimitedSheet(false);
            navigateToSubscriptionMain();
          },
        }}
      />
    </View>
  );
};

/** Figma text-icon-primary (rendered) for the "Feed" title */
const FEED_TITLE_COLOR_LIGHT = "#091B21";
/** Figma 8025:83772 "no post" illustration */
const EMPTY_IMAGE_WIDTH = 173;
const EMPTY_IMAGE_HEIGHT = 152;
/** Figma: empty block starts 113pt below the tabs on an 812pt screen */
const EMPTY_TOP_RATIO = 113 / 812;

const styles = StyleSheet.create({
  /** Figma Title/18px/Bold (overrides title/large 28pt) */
  headerTitle: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    lineHeight: 24,
    paddingVertical: 0,
  },
  emptyWrap: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  /** Figma: illustration → text 16pt */
  emptyBlock: {
    width: "100%",
    alignItems: "center",
    gap: 16,
  },
  /** Figma Body/16px/Medium, text-secondary, centred */
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
    textAlign: "center",
    marginTop: -12,
  },
  container: {
    flex: 1,
  },
  headerBgClip: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    overflow: "hidden",
    zIndex: 0,
  },
  headerBgImage: {
    width: "100%",
    height: "100%",
  },
  content: {
    flex: 1,
    zIndex: 1,
  },
  reportKeyboardSettled: {
    flex: 1,
    paddingBottom: 0,
    marginBottom: 0,
  },
});
