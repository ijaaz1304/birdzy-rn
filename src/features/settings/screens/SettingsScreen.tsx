/**
 * Settings Main Screen
 * Refactored with proper structure, navigation, and theming
 */

import { AppImage } from "@/components/AppImage";
import React, { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  RateUsModal,
  FeedbackModal,
  NotificationPermissionPopup,
  // CameraPermissionPopup,
} from "../../../molecules/Modal";
import { sendRatingFeedback } from "../../../services/rating/ratingFeedback.service";
import { useToast } from "../../../hooks";
import { useRateUsStore } from "../../rate-us/rate-us.store";
import { DeleteAccountConfirmation } from "../../../components/DeleteAccountConfirmation";
import { View, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { Text, NavBackIcon } from "../../../atoms";
import { SettingsStackParamList } from "../../../navigation/types";
import { useThemeContext } from "../../../app/ThemeProvider";
import { getAppearanceModeLabel } from "../utils/appearanceLabels";
import { trackAppearanceSettingsOpened } from "../../theme/themeExperiment.service";
import { useThemeExperiment } from "../../theme/useThemeExperiment";
import { useAuthStore } from "../../auth/auth.store";
import {
  useSubscriptionStore,
  selectIsPremium,
} from "../../subscription/subscription.store";
import { useSubscriptionPlansWithPrices } from "../../subscription/hooks/useSubscriptionPlansWithPrices";
import {
  OVERLAY_COLORS,
} from "../../../constants/colorConstants";
import { SETTINGS_STRINGS } from "../../../config/strings/settings.strings";
import { useStrings } from "../../../hooks/useStrings";
// import { DevEnvironmentInfo } from "../components/DevEnvironmentInfo";
import { SettingsSection, SettingsItem } from "../components";
import { useAppLogsStore, isAppLogsFeatureEnabled } from "../../../features/app-logs/app-logs.store";
import { openAppStoreForRating } from "../../../utils/modalHelpers";
import { usePushNotifications } from "../../../hooks/usePushNotifications";
import { Radius } from "../../../design";

import { spacing } from "../../../design-system/spacing";

import { APP_COLORS } from "../../../config/colors";

import {
  checkNotificationPermission,
  // requestCameraPermission,
} from "../../../services/permissions";
import {
  getBirdRegionLabel,
  getBirdRegionPreference,
  type BirdRegionId,
} from "../../../services/session/birdRegionPreference.service";
import { syncNotificationTopics } from "../../../services/notifications/notificationTopics.service";
import { loadNotificationPreferences } from "../notificationsPreference.storage";

type SettingsScreenNavigationProp = NativeStackNavigationProp<
  SettingsStackParamList,
  "SettingsMain"
>;

export const SettingsScreen: React.FC = () => {
  const { theme, themeMode } = useThemeContext();
  const { canChangeAppearance } = useThemeExperiment();
  const colors = theme.colors;
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const { user, isAuthenticated, token, guestId } = useAuthStore();
  const isGuest = !!user?.isGuest;
  // Show Login for: not signed in, or guest user (by flag or by having guestId from guest login)
  const showLoginButton =
    !isAuthenticated || isGuest || (isAuthenticated && !!guestId);
  const subscription = useSubscriptionStore((s) => s.subscription);
  const isPremium = useSubscriptionStore(selectIsPremium);
  const appLogsEnabled = useAppLogsStore((s) => s.isEnabled);
  const setAppLogsEnabled = useAppLogsStore((s) => s.setEnabled);
  const cameraUploadLogsEnabled = useAppLogsStore((s) => s.cameraUploadLogsEnabled);
  const setCameraUploadLogsEnabled = useAppLogsStore(
    (s) => s.setCameraUploadLogsEnabled
  );
  const { plans: subscriptionPlansFromHook } = useSubscriptionPlansWithPrices();
  // const devForcePremium = useSubscriptionStore((s) => s.devForcePremium);
  // const setDevForcePremium = useSubscriptionStore((s) => s.setDevForcePremium);
  const _strings = useStrings();
  const { showToast } = useToast();
  const { registerDevice } = usePushNotifications();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [showNotificationPermissionPopup, setShowNotificationPermissionPopup] =
    useState(false);
  const [showRateUsModal, setShowRateUsModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [_feedbackSource, setFeedbackSource] = useState<"menu" | "rate_us">(
    "menu"
  );
  const [lowRatingFromRateUs, setLowRatingFromRateUs] = useState<
    number | undefined
  >();
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [birdRegionLabel, setBirdRegionLabel] = useState(
    getBirdRegionLabel("auto")
  );
  // const [showCameraPermissionPopup, setShowCameraPermissionPopup] =
  //   useState(false);
  // const [cameraPreviewLoading, setCameraPreviewLoading] = useState(false);
  // const [cameraPreviewBlocked, setCameraPreviewBlocked] = useState(false);
  const { setHasRated, setHasDeclined } = useRateUsStore();

  // Sync notification toggle with device permission (and optional registration)
  useEffect(() => {
    let mounted = true;
    checkNotificationPermission().then((result) => {
      if (mounted) setNotificationsEnabled(result.granted);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      void checkNotificationPermission().then((result) => {
        setNotificationsEnabled(result.granted);
      });
      void getBirdRegionPreference().then((regionId: BirdRegionId) => {
        setBirdRegionLabel(getBirdRegionLabel(regionId));
      });
    }, [])
  );

  const syncNotificationToggleFromPermission = useCallback(async () => {
    const result = await checkNotificationPermission();
    setNotificationsEnabled(result.granted);
    return result.granted;
  }, []);

  const handleNotificationToggle = async (value: boolean) => {
    if (value) {
      if (!token) {
        showToast("Please sign in to enable notifications", "info");
        return;
      }
      // Keep switch off until the custom sheet grants permission.
      setNotificationsEnabled(false);
      setShowNotificationPermissionPopup(true);
      return;
    }

    setNotificationsEnabled(false);
    await AsyncStorage.removeItem("@device_registered");
    showToast("Notifications disabled", "success");
  };

  const handleNotificationPermissionGranted = useCallback(() => {
    setShowNotificationPermissionPopup(false);
    setNotificationsEnabled(true);
    showToast("Notifications enabled", "success");
    registerDevice({ requestPermission: false }).catch(() => {
      // Permission was granted; registration may retry on next app focus.
    });
    void loadNotificationPreferences().then((prefs) => {
      void syncNotificationTopics(prefs);
    });
  }, [registerDevice, showToast]);

  const handleNotificationPermissionClose = useCallback(() => {
    setShowNotificationPermissionPopup(false);
    void syncNotificationToggleFromPermission();
  }, [syncNotificationToggleFromPermission]);
  // const isDevSettingsVisible = __DEV__ && getAppIntent() === "dev";

  const handleRateUsClose = () => {
    setShowRateUsModal(false);
    setHasDeclined(true);
  };

  const handleRateUsLowRating = (rating: number) => {
    setShowRateUsModal(false);
    setLowRatingFromRateUs(rating);
    setFeedbackSource("rate_us");
    setShowFeedbackModal(true);
  };

  const handleRateUsHighRating = async (rating: number) => {
    setHasRated(true);
    setShowRateUsModal(false);
    void sendRatingFeedback({
      domain: "Birds",
      message: "",
      rating,
      source: "rate_us",
    }).catch(() => {
      /* non-blocking */
    });
    await openAppStoreForRating();
  };

  const handleFeedbackSubmit = async (data: {
    name: string;
    email: string;
    feedback: string;
    rating?: number;
  }) => {
    try {
      await sendRatingFeedback({
        domain: "Birds",
        name: data.name || undefined,
        email: data.email || undefined,
        message: data.feedback,
        rating: data.rating ?? lowRatingFromRateUs,
        source: "rate_us",
      });
      showToast("Thank you for your feedback!", "success");
      setShowFeedbackModal(false);
      setLowRatingFromRateUs(undefined);
    } catch (e) {
      showToast("Failed to send. Please try again.", "error");
    }
  };

  const subscriptionPlans = subscriptionPlansFromHook;
  const _activePlan = subscription?.planId
    ? subscriptionPlans.find((p) => p.id === subscription.planId)
    : null;

  const handleManageSubscription = () => {
    // Navigate to subscription management
    navigation
      .getParent()
      ?.navigate("SubscriptionStack", { screen: "SubscriptionMain" });
  };

  const handleLogin = () => {
    // Pass guest details when user is guest so Login/SignUp can promote guest account
    navigation.getParent()?.navigate("AuthStack", {
      screen: "Login",
      params: isGuest && guestId ? { guestId, fromGuest: true } : undefined,
    });
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top", "bottom"]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <NavBackIcon color={colors.textPrimary} />
        </TouchableOpacity>
        <Text
          variant="title"
          size="medium"
          weight="bold"
          style={styles.headerTitle}
        >
          {SETTINGS_STRINGS.screen.title}
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ACCOUNT SECTION */}
        <SettingsSection title={SETTINGS_STRINGS.sections.account}>
          <SettingsItem
            title={SETTINGS_STRINGS.account.myProfile}
            onPress={() =>
              isAuthenticated
                ? navigation.navigate("ProfileSettings")
                : handleLogin()
            }
            showArrow={true}
            leftComponent={
              <View
                style={[
                  styles.avatarCircle,
                  { backgroundColor: colors.surfaceVariant, marginRight: 12 },
                ]}
              >
                {user?.avatar ? (
                  <AppImage
                    source={{ uri: user.avatar }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <MaterialIcons
                    name="person"
                    size={24}
                    color={colors.textTertiary}
                  />
                )}
              </View>
            }
          />
          {showLoginButton && (
            <SettingsItem
              title={SETTINGS_STRINGS.account.loginText}
              onPress={handleLogin}
              showArrow={true}
            />
          )}
          <SettingsItem
            title={SETTINGS_STRINGS.account.emailAndPassword}
            onPress={() =>
              isAuthenticated
                ? navigation.navigate("ProfileSettings")
                : handleLogin()
            }
            showArrow={true}
          />
          {isAuthenticated && (
            <SettingsItem
              title="Account Actions"
              onPress={() => navigation.navigate("AccountActions")}
              showArrow={true}
            />
          )}
          <SettingsItem
            title={
              isPremium
                ? SETTINGS_STRINGS.items.manageSubscription
                : SETTINGS_STRINGS.items.subscription
            }
            onPress={handleManageSubscription}
            showArrow={true}
          />
        </SettingsSection>

        {/* SUPPORT SECTION */}
        <SettingsSection title={SETTINGS_STRINGS.sections.support}>
          <SettingsItem
            title={SETTINGS_STRINGS.items.faq}
            onPress={() => navigation.navigate("FAQ")}
            showArrow={true}
          />
          <SettingsItem
            title={SETTINGS_STRINGS.items.rateUs}
            onPress={() => setShowRateUsModal(true)}
            showArrow={true}
          />
          <SettingsItem
            title={SETTINGS_STRINGS.items.feedback}
            onPress={() => {
              setFeedbackSource("menu");
              setShowFeedbackModal(true);
            }}
            showArrow={true}
          />
        </SettingsSection>

        {/* PREFERENCES SECTION */}
        <SettingsSection title={SETTINGS_STRINGS.sections.preferences}>
          {/* Dev: force premium toggle */}
          {/* {__DEV__ && (
            <SettingsItem
              title={SETTINGS_STRINGS.items.usePremium}
              switchValue={devForcePremium}
              onSwitchChange={setDevForcePremium}
            />
          )} */}
          {/* Dev: disable 50% discount testing toggle */}
          {/* <SettingsItem
            title={SETTINGS_STRINGS.items.disable50Discount}
            subtitle={SETTINGS_STRINGS.items.disable50DiscountSubtitle}
            switchValue={devDisable50Discount}
            onSwitchChange={setDevDisable50Discount}
          /> */}
          <SettingsItem
            title={SETTINGS_STRINGS.preferences.notificationSettings}
            onPress={() => navigation.navigate("Notifications")}
            showArrow={true}
          />
          <SettingsItem
            title={SETTINGS_STRINGS.preferences.birdRegion}
            value={birdRegionLabel}
            onPress={() => navigation.navigate("BirdRegion")}
            showArrow={true}
          />
          <SettingsItem
            title={SETTINGS_STRINGS.preferences.notifications}
            switchValue={notificationsEnabled}
            onSwitchChange={handleNotificationToggle}
          />
          {canChangeAppearance && (
            <SettingsItem
              title={SETTINGS_STRINGS.preferences.appearance}
              value={getAppearanceModeLabel(themeMode)}
              onPress={() => {
                trackAppearanceSettingsOpened(themeMode);
                navigation.navigate("Appearance");
              }}
              showArrow={true}
            />
          )}
        </SettingsSection>

        {/* DIAGNOSTICS — dev builds only; hidden in production */}
        {isAppLogsFeatureEnabled() ? (
        <SettingsSection title={SETTINGS_STRINGS.sections.diagnostics}>
          <SettingsItem
            title={SETTINGS_STRINGS.items.recordDiagnosticLogs}
            subtitle={SETTINGS_STRINGS.items.recordDiagnosticLogsSubtitle}
            switchValue={appLogsEnabled}
            onSwitchChange={setAppLogsEnabled}
          />
          <SettingsItem
            title={SETTINGS_STRINGS.items.cameraUploadLogs}
            subtitle={SETTINGS_STRINGS.items.cameraUploadLogsSubtitle}
            switchValue={cameraUploadLogsEnabled}
            onSwitchChange={setCameraUploadLogsEnabled}
          />
          <SettingsItem
            title={SETTINGS_STRINGS.items.appLogs}
            subtitle={SETTINGS_STRINGS.items.viewAppLogsSubtitle}
            onPress={() => navigation.navigate("AppLogs")}
            showArrow={true}
          />
        </SettingsSection>
        ) : null}

        {/* MORE SECTION */}
        <SettingsSection title={SETTINGS_STRINGS.sections.more}>
          <SettingsItem
            title={SETTINGS_STRINGS.items.termsOfUse}
            onPress={() => navigation.navigate("Terms")}
            showArrow={true}
          />
          <SettingsItem
            title={SETTINGS_STRINGS.items.privacyPolicy}
            onPress={() => navigation.navigate("Privacy")}
            showArrow={true}
          />
        </SettingsSection>

        {/* Dev: environment info, version details, Crashlytics test */}
        {/* {isDevSettingsVisible && (
          <>
            <SettingsSection title="Dev">
              <SettingsItem
                title="Version Details"
                onPress={() => {}}
                showArrow={true}
              />
            </SettingsSection>

            <SettingsSection title="Testing">
              <SettingsItem
                title="Trigger test crash (Crashlytics)"
                onPress={() => {
                  try {
                    firebaseCrashlytics.crash();
                  } catch (e) {
                    showToast("Crashlytics not available", "error");
                  }
                }}
                textColor={colors.error}
                rightComponent={
                  <MaterialIcons
                    name="warning"
                    size={24}
                    color={colors.error}
                  />
                }
              />
            </SettingsSection>

            <DevEnvironmentInfo />
          </>
        )} */}
      </ScrollView>

      <RateUsModal
        visible={showRateUsModal}
        onClose={handleRateUsClose}
        onLowRating={handleRateUsLowRating}
        onHighRating={handleRateUsHighRating}
      />

      <NotificationPermissionPopup
        visible={showNotificationPermissionPopup}
        onClose={handleNotificationPermissionClose}
        onGranted={handleNotificationPermissionGranted}
        userId={user?.id}
      />

      <FeedbackModal
        visible={showFeedbackModal}
        onClose={() => {
          setShowFeedbackModal(false);
          setLowRatingFromRateUs(undefined);
        }}
        onSubmit={handleFeedbackSubmit}
        rating={lowRatingFromRateUs}
      />

      {/* Dev: camera permission popup preview */}
      {/* <CameraPermissionPopup
        visible={showCameraPermissionPopup}
        onClose={() => setShowCameraPermissionPopup(false)}
        onAllowCamera={async () => {
          setCameraPreviewLoading(true);
          try {
            const result = await requestCameraPermission();
            if (result.granted) {
              setShowCameraPermissionPopup(false);
              showToast("Camera permission granted", "success");
              return;
            }
            setCameraPreviewBlocked(!!result.blocked);
          } finally {
            setCameraPreviewLoading(false);
          }
        }}
        onSkip={() => setShowCameraPermissionPopup(false)}
        loading={cameraPreviewLoading}
        openSettings={cameraPreviewBlocked}
      /> */}

      <DeleteAccountConfirmation
        visible={showDeleteAccount}
        onClose={() => setShowDeleteAccount(false)}
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
    paddingHorizontal: spacing[4],
    paddingVertical: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
  },
  headerRight: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing[4],
    paddingBottom: 32,
  },
  loginButton: {
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  premiumCard: {
    overflow: "hidden",
    position: "relative",
  },
  premiumCardContent: {
    flexDirection: "row",
    padding: spacing[4],
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  premiumCardLeft: {
    flex: 1,
  },
  premiumCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  activeBadge: {
    marginLeft: 8,
  },
  beetlePlaceholder: {
    width: 60,
    height: 60,
    marginTop: 8,
    backgroundColor: OVERLAY_COLORS.BACKDROP_VERY_LIGHT,
    borderRadius: Radius.sm,
  },
  premiumCardRight: {
    alignItems: "flex-end",
    gap: 8,
  },
  manageButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  logoutButton: {
    alignItems: "center",
    borderWidth: 1,
    borderColor: APP_COLORS.borderGray,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
});
