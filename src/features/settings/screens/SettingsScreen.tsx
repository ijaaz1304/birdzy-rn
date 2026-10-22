/**
 * Settings Main Screen
 */

import React, { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  RateUsModal,
  FeedbackModal,
  NotificationPermissionPopup,
} from "../../../molecules/Modal";
import { sendRatingFeedback } from "../../../services/rating/ratingFeedback.service";
import { useToast } from "../../../hooks";
import { useRateUsStore } from "../../rate-us/rate-us.store";
import { DeleteAccountConfirmation } from "../../../components/DeleteAccountConfirmation";
import { LogoutConfirmation } from "../../../components/LogoutConfirmation";
import { StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SettingsStackParamList } from "../../../navigation/types";
import { useThemeContext } from "../../../app/ThemeProvider";
import { trackAppearanceSettingsOpened } from "../../theme/themeExperiment.service";
import { useThemeExperiment } from "../../theme/useThemeExperiment";
import { useAuthStore } from "../../auth/auth.store";
import { SETTINGS_STRINGS } from "../../../config/strings/settings.strings";
import {
  SettingsSection,
  SettingsItem,
  SettingsHeader,
  SettingsAccountRow,
} from "../components";
import { useSettingsColors } from "../settingsColors";
import {
  useAppLogsStore,
  isAppLogsFeatureEnabled,
} from "../../../features/app-logs/app-logs.store";
import { openAppStoreForRating } from "../../../utils/modalHelpers";
import { usePushNotifications } from "../../../hooks/usePushNotifications";
import { spacing } from "../../../design-system/spacing";
import { checkNotificationPermission } from "../../../services/permissions";
import { shouldShowLogoutAction } from "../utils/accountActions";

const M = SETTINGS_STRINGS.main;

type SettingsScreenNavigationProp = NativeStackNavigationProp<
  SettingsStackParamList,
  "SettingsMain"
>;

export const SettingsScreen: React.FC = () => {
  const { themeMode } = useThemeContext();
  const { canChangeAppearance } = useThemeExperiment();
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const { user, isAuthenticated, token, guestId } = useAuthStore();
  const isGuest = !!user?.isGuest;
  const showLoginButton =
    !isAuthenticated || isGuest || (isAuthenticated && !!guestId);
  const isSignedIn = !showLoginButton;
  const showLogout = shouldShowLogoutAction(user, guestId);
  const settingsColors = useSettingsColors();
  const appLogsEnabled = useAppLogsStore((s) => s.isEnabled);
  const setAppLogsEnabled = useAppLogsStore((s) => s.setEnabled);
  const cameraUploadLogsEnabled = useAppLogsStore(
    (s) => s.cameraUploadLogsEnabled
  );
  const setCameraUploadLogsEnabled = useAppLogsStore(
    (s) => s.setCameraUploadLogsEnabled
  );
  const { showToast } = useToast();
  const { registerDevice } = usePushNotifications();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [showNotificationPermissionPopup, setShowNotificationPermissionPopup] =
    useState(false);
  const [showRateUsModal, setShowRateUsModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackSource, setFeedbackSource] = useState<"rate_us" | "menu">(
    "menu"
  );
  const [lowRatingFromRateUs, setLowRatingFromRateUs] = useState<
    number | undefined
  >();
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { setHasRated, setHasDeclined } = useRateUsStore();

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
      const alreadyGranted = await checkNotificationPermission();
      if (alreadyGranted.granted) {
        setNotificationsEnabled(true);
        registerDevice({ requestPermission: false }).catch(() => undefined);
        return;
      }
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
  }, [registerDevice, showToast]);

  const handleNotificationPermissionClose = useCallback(() => {
    setShowNotificationPermissionPopup(false);
    void syncNotificationToggleFromPermission();
  }, [syncNotificationToggleFromPermission]);

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
        source: feedbackSource === "menu" ? "feedback" : "rate_us",
      });
      showToast("Thank you for your feedback!", "success");
      setShowFeedbackModal(false);
      setLowRatingFromRateUs(undefined);
      setFeedbackSource("menu");
    } catch (e) {
      showToast("Failed to send. Please try again.", "error");
      throw e;
    }
  };

  const handleLogin = () => {
    navigation.getParent()?.navigate("AuthStack", {
      screen: "Login",
      params: isGuest && guestId ? { guestId, fromGuest: true } : undefined,
    });
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: settingsColors.screen }]}
      edges={["top", "bottom"]}
    >
      <SettingsHeader title={SETTINGS_STRINGS.screen.title} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { gap: isSignedIn ? 24 : 16 }]}
        showsVerticalScrollIndicator={false}
      >
        <SettingsSection title={M.sections.account}>
          {isSignedIn && (
            <SettingsAccountRow
              variant="profile"
              title={M.profileTitle}
              subtitle={M.profileSubtitle}
              avatarUri={user?.avatar}
              onPress={() => navigation.navigate("ProfileSettings")}
            />
          )}
          {!isSignedIn && (
            <SettingsAccountRow
              variant="guest"
              title={M.guestTitle}
              subtitle={M.guestSubtitle}
              onPress={handleLogin}
            />
          )}
          {isSignedIn && (
            <SettingsItem
              icon="mail"
              title={M.loginSecurity}
              onPress={() => navigation.navigate("LoginSecurity")}
              showArrow
            />
          )}
          {/* Manage Subscription is hidden for all users. */}
        </SettingsSection>

        <SettingsSection title={M.sections.helpSupport}>
          <SettingsItem
            icon="faq"
            title={M.faqs}
            onPress={() => navigation.navigate("FAQ")}
            showArrow
          />
          <SettingsItem
            icon="mail"
            title={M.contactUs}
            onPress={() => navigation.navigate("ContactUs")}
            showArrow
          />
          <SettingsItem
            icon="star"
            title={M.rateUs}
            onPress={() => setShowRateUsModal(true)}
            showArrow
          />
          <SettingsItem
            icon="comment"
            title={M.feedback}
            onPress={() => {
              setLowRatingFromRateUs(undefined);
              setFeedbackSource("menu");
              setShowFeedbackModal(true);
            }}
            showArrow
          />
        </SettingsSection>

        <SettingsSection title={M.sections.preferences}>
          <SettingsItem
            title={SETTINGS_STRINGS.preferences.notificationSettings}
            onPress={() => navigation.navigate("Notifications")}
            showArrow
          />
          <SettingsItem
            title={SETTINGS_STRINGS.preferences.birdRegion}
            onPress={() => navigation.navigate("BirdRegion")}
            showArrow
          />
          <SettingsItem
            icon="notification"
            title={M.notifications}
            switchValue={notificationsEnabled}
            onSwitchChange={handleNotificationToggle}
          />
          {canChangeAppearance && (
            <SettingsItem
              icon="sun"
              title={M.appearance}
              value={SETTINGS_STRINGS.appearance.shortLabels[themeMode]}
              onPress={() => {
                trackAppearanceSettingsOpened(themeMode);
                navigation.navigate("Appearance");
              }}
              showArrow
            />
          )}
        </SettingsSection>

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
              showArrow
            />
          </SettingsSection>
        ) : null}

        <SettingsSection title={M.sections.others}>
          <SettingsItem
            icon="file"
            title={M.termsOfUse}
            onPress={() => navigation.navigate("Terms")}
            showArrow
          />
          <SettingsItem
            icon="shield"
            title={M.privacyPolicy}
            onPress={() => navigation.navigate("Privacy")}
            showArrow
          />
          <SettingsItem
            icon="delete"
            title={M.deleteAccount}
            onPress={() => setShowDeleteAccount(true)}
            showArrow
          />
          {showLogout && (
            <SettingsItem
              icon="logout"
              title={M.logOut}
              textColor={settingsColors.danger}
              onPress={() => setShowLogoutConfirm(true)}
              showArrow
            />
          )}
        </SettingsSection>
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
          setFeedbackSource("menu");
        }}
        onSubmit={handleFeedbackSubmit}
        rating={lowRatingFromRateUs}
      />

      <DeleteAccountConfirmation
        visible={showDeleteAccount}
        onClose={() => setShowDeleteAccount(false)}
      />

      <LogoutConfirmation
        visible={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing[4],
    paddingTop: 24,
    paddingBottom: 32,
  },
});
