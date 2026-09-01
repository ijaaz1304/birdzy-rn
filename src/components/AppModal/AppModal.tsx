/**
 * AppModal – single dynamic component for all popups and full-screen modals.
 * One shared chrome per variant (popup = center card + X; fullscreen = BackgroundHeader + close).
 * Content by type. Add new types in MODAL_CONFIG and renderContentForType.
 */

import { AppImage } from "@/components/AppImage";
import { CloseIcon } from "@/components/shared/CloseIcon";
import React, { useMemo, ReactNode } from "react";
import { View, StyleSheet, Modal as RNModal, TouchableOpacity, Dimensions, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Linking } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { Images } from "../../assets";
import { Text, Button } from "../../atoms";
import {
  OVERLAY_COLORS,
} from "../../constants/colorConstants";
import { BackgroundHeader } from "../../molecules/BackgroundHeader";
import { useAuthStore } from "../../features/auth/auth.store";
import { requestNotificationPermission } from "../../services/permissions";
import { SETTINGS_STRINGS } from "../../config/strings/settings.strings";
import { COLLECTION_STRINGS } from "../../config/strings/collection.strings";

import { FONTS } from "../../common/typography";

import { SCREEN_COLORS } from "../../constants/colorConstants";

import { Radius } from "../../design";

import { getPopupChromeStyle, getPopupPrimaryCtaStyle, getPopupPrimaryCtaTextColor, getPopupSecondaryCtaStyle, getPopupSecondaryCtaTextColor } from "../../design-system/modalTokens";
import { getAppStoreUrl } from "../../constants/appStoreConstants";
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// ---- Type registry ----
export type AppModalType =
  | "subscriptionFailed"
  | "rateUsPopup"
  | "stayUpdated"
  | "writeFeedback"
  | "enablePushNotifications"
  | "logoutConfirm"
  | "deletePost"
  | "deleteCollection"
  | "congratulations"
  | "couldNotIdentify";

export type AppModalPayload = {
  subscriptionFailed?: {
    onRetry: () => void;
    /** Short headline (replaces default "Subscription Failed" subtitle line 1) */
    summary?: string;
    /** Technical / full message shown in popup */
    detail?: string;
    /** Rocks app account (masked email), not Apple ID */
    appAccountMasked?: string;
    transientStoreKit?: boolean;
  };
  rateUsPopup?: { storeUrl?: string };
  stayUpdated?: { onEnableUpdates: () => void };
  writeFeedback?: { onWriteFeedback: () => void };
  enablePushNotifications?: { onSuccess?: () => void };
  logoutConfirm?: Record<string, never>;
  deletePost?: { onConfirm: () => void };
  deleteCollection?: {
    onConfirm: () => void | Promise<void>;
    isLoading?: boolean;
  };
  congratulations?: {
    title: string;
    subtitle?: string;
    buttons: Array<{
      label: string;
      onPress: () => void;
      variant?: "primary" | "outline" | "ghost";
    }>;
    image?: number | { uri: string };
  };
  couldNotIdentify?: {
    title: string;
    subtitle?: string;
    buttons: Array<{
      label: string;
      onPress: () => void;
      variant?: "primary" | "outline" | "ghost";
    }>;
  };
};

type ModalConfig = {
  variant: "popup" | "fullscreen";
};

const MODAL_CONFIG: Record<AppModalType, ModalConfig> = {
  subscriptionFailed: { variant: "popup" },
  rateUsPopup: { variant: "popup" },
  stayUpdated: { variant: "popup" },
  writeFeedback: { variant: "popup" },
  enablePushNotifications: { variant: "popup" },
  logoutConfirm: { variant: "popup" },
  deletePost: { variant: "popup" },
  deleteCollection: { variant: "popup" },
  congratulations: { variant: "fullscreen" },
  couldNotIdentify: { variant: "fullscreen" },
};

export interface AppModalProps {
  visible: boolean;
  onClose: () => void;
  type: AppModalType;
  payload: AppModalPayload[AppModalType];
}

export const AppModal: React.FC<AppModalProps> = ({
  visible,
  onClose,
  type,
  payload,
}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const config = MODAL_CONFIG[type];
  const isPopup = config.variant === "popup";

  const content = useMemo(
    () =>
      renderContentForType(type, payload, {
        theme,
        onClose,
        isDark: theme.mode === "dark",
        insets,
      }),
    [type, payload, theme, onClose, insets]
  );

  if (!visible) return null;

  const isDeleteConfirmPopup =
    type === "deletePost" || type === "deleteCollection";

  if (isPopup) {
    return (
      <RNModal
        visible
        transparent
        animationType="fade"
        onRequestClose={onClose}
        statusBarTranslucent
      >
        <TouchableOpacity
          style={styles.popupBackdrop}
          activeOpacity={1}
          onPress={onClose}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={[
              styles.popupCard,
              getPopupChromeStyle(theme),
              theme.mode === "light" && {
                borderWidth: 1,
                borderColor: SCREEN_COLORS.LIGHT.border,
              },
              type === "stayUpdated" && {
                minHeight: SCREEN_HEIGHT * 0.38,
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.popupClose,
                {
                  top: isDeleteConfirmPopup ? 12 : theme.spacing[3],
                  right: isDeleteConfirmPopup ? 12 : theme.spacing[3],
                },
              ]}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <CloseIcon isDark={theme.mode === "dark"} />
            </TouchableOpacity>
            <View
              style={[
                styles.popupContent,
                isDeleteConfirmPopup
                  ? {
                      paddingTop: theme.spacing[4],
                      paddingBottom: theme.spacing[5],
                      paddingHorizontal: theme.spacing[5],
                    }
                  : { padding: theme.spacing[5] },
              ]}
            >
              {content}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </RNModal>
    );
  }

  // Fullscreen modal
  return (
    <RNModal
      visible
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View
        style={[
          styles.fullScreen,
          { backgroundColor: theme.colors.cardBackground },
        ]}
      >
        <BackgroundHeader height={200} />
        <TouchableOpacity
          style={[
            styles.fullscreenClose,
            { top: insets.top + theme.spacing[2], right: theme.spacing[4] },
          ]}
          onPress={onClose}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <CloseIcon isDark={theme.mode === "dark"} />
        </TouchableOpacity>
        <ScrollView
          style={styles.fullscreenScroll}
          contentContainerStyle={[
            styles.fullscreenScrollContent,
            { paddingBottom: insets.bottom + theme.spacing[6] },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {content}
        </ScrollView>
      </View>
    </RNModal>
  );
};

type ContentContext = {
  theme: ReturnType<typeof useTheme>;
  onClose: () => void;
  isDark: boolean;
  insets: ReturnType<typeof useSafeAreaInsets>;
};

function renderContentForType(
  type: AppModalType,
  payload: AppModalPayload[AppModalType],
  ctx: ContentContext
): ReactNode {
  switch (type) {
    case "subscriptionFailed":
      return payload && "onRetry" in payload ? (
        <SubscriptionFailedContent
          onRetry={payload.onRetry}
          theme={ctx.theme}
          summary={payload.summary}
          detail={payload.detail}
          appAccountMasked={payload.appAccountMasked}
          transientStoreKit={payload.transientStoreKit}
        />
      ) : null;
    case "rateUsPopup":
      return (
        <RateUsPopupContent
          payload={payload as AppModalPayload["rateUsPopup"]}
          onClose={ctx.onClose}
          theme={ctx.theme}
        />
      );
    case "stayUpdated":
      return payload && "onEnableUpdates" in payload ? (
        <StayUpdatedContent
          onEnableUpdates={payload.onEnableUpdates}
          onClose={ctx.onClose}
          theme={ctx.theme}
        />
      ) : null;
    case "writeFeedback":
      return payload && "onWriteFeedback" in payload ? (
        <WriteFeedbackContent
          onWriteFeedback={payload.onWriteFeedback}
          onClose={ctx.onClose}
          theme={ctx.theme}
        />
      ) : null;
    case "enablePushNotifications":
      return payload ? (
        <EnablePushContent
          onSuccess={"onSuccess" in payload ? payload.onSuccess : undefined}
          onClose={ctx.onClose}
          theme={ctx.theme}
        />
      ) : null;
    case "logoutConfirm":
      return <LogoutConfirmContent onClose={ctx.onClose} theme={ctx.theme} />;
    case "deletePost":
      return payload && "onConfirm" in payload ? (
        <DeletePostContent
          onConfirm={payload.onConfirm}
          onClose={ctx.onClose}
          theme={ctx.theme}
        />
      ) : null;
    case "deleteCollection":
      return payload && "onConfirm" in payload ? (
        <DeleteCollectionContent
          onConfirm={payload.onConfirm}
          isLoading={"isLoading" in payload ? payload.isLoading : undefined}
          onClose={ctx.onClose}
          theme={ctx.theme}
        />
      ) : null;
    case "congratulations":
      return payload && "title" in payload && "buttons" in payload ? (
        <CongratulationsContent
          payload={payload as NonNullable<AppModalPayload["congratulations"]>}
          theme={ctx.theme}
        />
      ) : null;
    case "couldNotIdentify":
      return payload && "title" in payload && "buttons" in payload ? (
        <CouldNotIdentifyContent
          payload={payload as NonNullable<AppModalPayload["couldNotIdentify"]>}
          theme={ctx.theme}
        />
      ) : null;
    default:
      return null;
  }
}

// ---- Popup content (center card body) ----
function SubscriptionFailedContent({
  onRetry,
  theme,
  summary,
  detail,
  appAccountMasked,
  transientStoreKit,
}: {
  onRetry: () => void;
  theme: ReturnType<typeof useTheme>;
  summary?: string;
  detail?: string;
  appAccountMasked?: string;
  transientStoreKit?: boolean;
}) {
  const headline = summary?.trim() || "Subscription Failed";
  const defaultBody =
    "We couldn't process your subscription. Please check your payment method and try again.";
  const bodyText =
    detail?.trim() ||
    (transientStoreKit
      ? "The App Store had a temporary issue. Try Restore purchases or try again shortly."
      : defaultBody);

  return (
    <>
      <View style={[popupStyles.iconWrap, { marginBottom: theme.spacing[4] }]}>
        <AppImage
          source={
            theme.mode === "dark"
              ? Images.subscriptionFailedDark
              : Images.subscriptionFailed
          }
          style={popupStyles.icon}
          resizeMode="contain"
        />
      </View>
      <Text
        variant="headline"
        size="large"
        weight="bold"
        style={[
          popupStyles.compactTitle,
          { color: theme.colors.textPrimary, marginBottom: theme.spacing[2] },
        ]}
      >
        {headline}
      </Text>
      {appAccountMasked ? (
        <Text
          variant="body"
          size="small"
          style={[
            popupStyles.subtitle,
            {
              color: theme.colors.textSecondary,
              marginBottom: theme.spacing[2],
            },
          ]}
        >
          App account: {appAccountMasked}
        </Text>
      ) : null}
      <ScrollView
        style={{ maxHeight: SCREEN_HEIGHT * 0.32 }}
        showsVerticalScrollIndicator
        nestedScrollEnabled
      >
        <Text
          variant="body"
          size="medium"
          style={[
            popupStyles.subtitle,
            {
              color: theme.colors.textSecondary,
              marginBottom: theme.spacing[6],
            },
          ]}
        >
          {bodyText}
        </Text>
      </ScrollView>
      <Button
        title="Try again"
        variant="primary"
        size="large"
        onPress={onRetry}
        fullWidth
        style={getPopupPrimaryCtaStyle(theme)}
        textStyle={{ color: getPopupPrimaryCtaTextColor(theme) }}
      />
    </>
  );
}

function RateUsPopupContent({
  payload,
  onClose,
  theme,
}: {
  payload: AppModalPayload["rateUsPopup"];
  onClose: () => void;
  theme: ReturnType<typeof useTheme>;
}) {
  const handleRateNow = async () => {
    try {
      const url = payload?.storeUrl || getAppStoreUrl();
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) await Linking.openURL(url);
    } catch (e) {
      console.error("Failed to open store:", e);
    }
    onClose();
  };
  return (
    <>
      <View style={[popupStyles.iconWrap, { marginBottom: theme.spacing[4] }]}>
        <AppImage
          source={Images.rateUsPopupIllustration}
          style={popupStyles.rateUsIcon}
          resizeMode="contain"
        />
      </View>
      <Text
        variant="headline"
        size="large"
        weight="bold"
        style={[
          popupStyles.title,
          { color: theme.colors.textPrimary, marginBottom: theme.spacing[2] },
        ]}
      >
        Enjoying Birdzy?
      </Text>
      <Text
        variant="body"
        size="medium"
        style={[
          popupStyles.subtitle,
          { color: theme.colors.textSecondary, marginBottom: theme.spacing[6] },
        ]}
      >
        Help us grow by rating the app on the store. Your feedback matters!
      </Text>
      <Button
        title="Rate Now"
        variant="primary"
        size="large"
        onPress={handleRateNow}
        fullWidth
        style={getPopupPrimaryCtaStyle(theme)}
        textStyle={{ color: getPopupPrimaryCtaTextColor(theme) }}
      />
      <TouchableOpacity
        onPress={onClose}
        style={[popupStyles.secondaryCta, getPopupSecondaryCtaStyle(theme)]}
      >
        <Text
          variant="body"
          size="medium"
          weight="medium"
          style={{
            color: theme.colors.textSecondary,
            textDecorationLine: "underline",
          }}
        >
          Later
        </Text>
      </TouchableOpacity>
    </>
  );
}

function StayUpdatedContent({
  onEnableUpdates,
  onClose,
  theme,
}: {
  onEnableUpdates: () => void;
  onClose: () => void;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <>
      <View style={[popupStyles.iconWrap, { marginBottom: theme.spacing[4] }]}>
        <AppImage
          source={Images.speciesStayUpdated}
          style={popupStyles.icon}
          resizeMode="contain"
        />
      </View>
      <Text
        variant="headline"
        size="large"
        weight="bold"
        style={[
          popupStyles.title,
          { color: theme.colors.textPrimary, marginBottom: theme.spacing[2] },
        ]}
      >
        Stay Updated
      </Text>
      <Text
        variant="body"
        size="medium"
        style={[
          popupStyles.subtitle,
          { color: theme.colors.textSecondary, marginBottom: theme.spacing[6] },
        ]}
      >
        Enable notifications to stay informed about new features, bird
        discoveries, and app updates.
      </Text>
      <Button
        title="Enable Updates"
        variant="primary"
        size="large"
        onPress={onEnableUpdates}
        fullWidth
        style={getPopupPrimaryCtaStyle(theme)}
        textStyle={{ color: getPopupPrimaryCtaTextColor(theme) }}
      />
      <TouchableOpacity
        onPress={onClose}
        style={[popupStyles.secondaryCta, getPopupSecondaryCtaStyle(theme)]}
      >
        <Text
          variant="body"
          size="medium"
          weight="medium"
          style={{
            color: theme.colors.textSecondary,
            textDecorationLine: "underline",
          }}
        >
          Later
        </Text>
      </TouchableOpacity>
    </>
  );
}

function WriteFeedbackContent({
  onWriteFeedback,
  onClose: _onClose,
  theme,
}: {
  onWriteFeedback: () => void;
  onClose: () => void;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <>
      <View style={[popupStyles.iconWrap, { marginBottom: theme.spacing[4] }]}>
        <AppImage
          source={Images.popupFeed}
          style={popupStyles.icon}
          resizeMode="contain"
        />
      </View>
      <Text
        variant="headline"
        size="large"
        weight="bold"
        style={[
          popupStyles.title,
          { color: theme.colors.textPrimary, marginBottom: theme.spacing[2] },
        ]}
      >
        We'd Love Your Feedback
      </Text>
      <Text
        variant="body"
        size="medium"
        style={[
          popupStyles.subtitle,
          { color: theme.colors.textSecondary, marginBottom: theme.spacing[6] },
        ]}
      >
        Share your thoughts, suggestions, or report any issues. Your feedback
        helps us improve!
      </Text>
      <Button
        title="Write Feedback"
        variant="primary"
        size="large"
        onPress={onWriteFeedback}
        fullWidth
        style={getPopupPrimaryCtaStyle(theme)}
        textStyle={{ color: getPopupPrimaryCtaTextColor(theme) }}
      />
    </>
  );
}

function EnablePushContent({
  onSuccess,
  onClose,
  theme,
}: {
  onSuccess?: () => void;
  onClose: () => void;
  theme: ReturnType<typeof useTheme>;
}) {
  const handleAllow = async () => {
    try {
      const result = await requestNotificationPermission();
      if (result.granted) onSuccess?.();
    } catch (e) {
      console.error("Failed to request notification permission:", e);
    }
    onClose();
  };
  return (
    <>
      <View style={[popupStyles.iconWrap, { marginBottom: theme.spacing[4] }]}>
        <AppImage
          source={Images.speciesStayUpdated}
          style={popupStyles.icon}
          resizeMode="contain"
        />
      </View>
      <Text
        variant="headline"
        size="large"
        weight="bold"
        style={[
          popupStyles.title,
          { color: theme.colors.textPrimary, marginBottom: theme.spacing[2] },
        ]}
      >
        Enable Push Notifications
      </Text>
      <Text
        variant="body"
        size="medium"
        style={[
          popupStyles.subtitle,
          { color: theme.colors.textSecondary, marginBottom: theme.spacing[6] },
        ]}
      >
        Get notified about new birds, identification updates, and community
        activity.
      </Text>
      <Button
        title="Continue"
        variant="primary"
        size="large"
        onPress={handleAllow}
        fullWidth
        style={getPopupPrimaryCtaStyle(theme)}
        textStyle={{ color: getPopupPrimaryCtaTextColor(theme) }}
      />
    </>
  );
}

function LogoutConfirmContent({
  onClose,
  theme,
}: {
  onClose: () => void;
  theme: ReturnType<typeof useTheme>;
}) {
  const { logout, isLoading } = useAuthStore();
  const strings = SETTINGS_STRINGS.account;
  const handleLogout = async () => {
    try {
      await logout();
      onClose();
    } catch {
      onClose();
    }
  };
  return (
    <>
      <Text
        variant="headline"
        size="large"
        weight="bold"
        style={[
          popupStyles.title,
          { color: theme.colors.textPrimary, marginBottom: theme.spacing[2] },
        ]}
      >
        {strings.logOutConfirmTitle}
      </Text>
      <Text
        variant="body"
        size="medium"
        style={[
          popupStyles.subtitle,
          { color: theme.colors.textSecondary, marginBottom: theme.spacing[6] },
        ]}
      >
        {strings.logOutConfirmMessage}
      </Text>
      <Button
        title={strings.logOutConfirmYes}
        variant="primary"
        size="large"
        onPress={handleLogout}
        fullWidth
        disabled={isLoading}
        loading={isLoading}
        style={getPopupPrimaryCtaStyle(theme)}
        textStyle={{ color: getPopupPrimaryCtaTextColor(theme) }}
      />
      <Button
        title={strings.logOutConfirmNoThanks}
        variant="secondary"
        size="large"
        onPress={onClose}
        fullWidth
        style={{
          marginTop: theme.spacing[3],
          ...getPopupSecondaryCtaStyle(theme),
        }}
        textStyle={{
          color: getPopupSecondaryCtaTextColor(theme),
        }}
      />
    </>
  );
}

function DeletePostContent({
  onConfirm,
  onClose,
  theme,
}: {
  onConfirm: () => void;
  onClose: () => void;
  theme: ReturnType<typeof useTheme>;
}) {
  const trashIcon =
    theme.mode === "dark" ? Images.trashDark : Images.trashLight;
  return (
    <>
      <View style={popupStyles.deleteConfirmIconWrap}>
        <AppImage
          source={trashIcon}
          style={popupStyles.deleteConfirmIcon}
          resizeMode="contain"
        />
      </View>
      <Text
        variant="title"
        size="large"
        weight="bold"
        style={[
          popupStyles.compactTitle,
          { color: theme.colors.textPrimary, marginBottom: theme.spacing[6] },
        ]}
      >
        Do you want to delete this post?
      </Text>
      <View style={popupStyles.deletePostButtons}>
        <TouchableOpacity
          onPress={() => {
            onClose();
            onConfirm();
          }}
          activeOpacity={0.7}
          style={[
            popupStyles.deletePostButton,
            {
              ...getPopupPrimaryCtaStyle(theme),
              marginBottom: 12,
            },
          ]}
        >
          <Text
            variant="label"
            size="medium"
            weight="semibold"
            style={{ color: theme.colors.onPrimary }}
          >
            Yes, Remove
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onClose}
          activeOpacity={0.7}
          style={[
            popupStyles.deletePostButton,
            getPopupSecondaryCtaStyle(theme),
          ]}
          >
          <Text
            variant="label"
            size="medium"
            weight="semibold"
            style={{ color: getPopupSecondaryCtaTextColor(theme) }}
          >
            No, Thanks
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

function DeleteCollectionContent({
  onConfirm,
  isLoading = false,
  onClose,
  theme,
}: {
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
  onClose: () => void;
  theme: ReturnType<typeof useTheme>;
}) {
  const strings = COLLECTION_STRINGS.deleteCollection;
  const trashIcon =
    theme.mode === "dark" ? Images.trashDark : Images.trashLight;

  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <>
      <View style={popupStyles.deleteConfirmIconWrap}>
        <AppImage
          source={trashIcon}
          style={popupStyles.deleteConfirmIcon}
          resizeMode="contain"
        />
      </View>
      <Text
        variant="title"
        size="large"
        weight="bold"
        style={[
          popupStyles.compactTitle,
          { color: theme.colors.textPrimary, marginBottom: theme.spacing[6] },
        ]}
      >
        {strings.message}
      </Text>
      <View style={popupStyles.deletePostButtons}>
        <Button
          title={strings.yesDelete}
          variant="primary"
          size="large"
          onPress={handleConfirm}
          fullWidth
          disabled={isLoading}
          loading={isLoading}
          style={{
            ...getPopupPrimaryCtaStyle(theme),
            marginBottom: theme.spacing[3],
          }}
          textStyle={{ color: getPopupPrimaryCtaTextColor(theme) }}
        />
        <Button
          title={strings.noThanks}
          variant="outline"
          size="large"
          onPress={onClose}
          fullWidth
          disabled={isLoading}
          style={getPopupSecondaryCtaStyle(theme)}
          textStyle={{
            color: getPopupSecondaryCtaTextColor(theme),
          }}
        />
      </View>
    </>
  );
}

// ---- Fullscreen content ----
function CongratulationsContent({
  payload,
  theme,
}: {
  payload: NonNullable<AppModalPayload["congratulations"]>;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <>
      <Text
        variant="headline"
        size="large"
        weight="bold"
        style={[fullStyles.title, { color: theme.colors.textPrimary }]}
      >
        {payload.title}
      </Text>
      {payload.subtitle ? (
        <Text
          variant="body"
          size="medium"
          color="textSecondary"
          style={fullStyles.subtitle}
        >
          {payload.subtitle}
        </Text>
      ) : null}
      <View style={fullStyles.visualWrap}>
        <AppImage
          source={
            payload.image != null
              ? typeof payload.image === "number"
                ? payload.image
                : { uri: payload.image.uri }
              : Images.mineralSample
          }
          style={fullStyles.centralImage}
          resizeMode="contain"
        />
      </View>
      <View style={fullStyles.actions}>
        {payload.buttons.map((btn, i) => (
          <Button
            key={i}
            title={btn.label}
            variant={btn.variant || "primary"}
            size="large"
            onPress={btn.onPress}
            style={[
              fullStyles.button,
              (!btn.variant || btn.variant === "primary") &&
                getPopupPrimaryCtaStyle(theme),
            ]}
            textStyle={
              !btn.variant || btn.variant === "primary"
                ? { color: getPopupPrimaryCtaTextColor(theme) }
                : undefined
            }
          />
        ))}
      </View>
    </>
  );
}

function CouldNotIdentifyContent({
  payload,
  theme,
}: {
  payload: NonNullable<AppModalPayload["couldNotIdentify"]>;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <>
      <Text
        variant="headline"
        size="large"
        weight="bold"
        style={[fullStyles.title, { color: theme.colors.textPrimary }]}
      >
        {payload.title}
      </Text>
      {payload.subtitle ? (
        <Text
          variant="body"
          size="medium"
          color="textSecondary"
          style={fullStyles.subtitle}
        >
          {payload.subtitle}
        </Text>
      ) : null}
      <View style={fullStyles.actions}>
        {payload.buttons.map((btn, i) => (
          <Button
            key={i}
            title={btn.label}
            variant={btn.variant || "primary"}
            size="large"
            onPress={btn.onPress}
            style={[
              fullStyles.button,
              (!btn.variant || btn.variant === "primary") &&
                getPopupPrimaryCtaStyle(theme),
            ]}
            textStyle={
              !btn.variant || btn.variant === "primary"
                ? { color: getPopupPrimaryCtaTextColor(theme) }
                : undefined
            }
          />
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  popupBackdrop: {
    flex: 1,
    backgroundColor: OVERLAY_COLORS.BACKDROP_LIGHT,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  popupCard: {
    width: Math.min(335, SCREEN_WIDTH - 40),
    position: "relative",
    overflow: "hidden",
  },
  popupClose: {
    position: "absolute",
    zIndex: 10,
    width: 40,
    height: 40,
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  popupContent: {
    alignItems: "center",
    zIndex: 2,
  },
  fullScreen: { flex: 1 },
  fullscreenClose: {
    position: "absolute",
    zIndex: 10,
    minWidth: 44,
    minHeight: 44,
    padding: 8,
    borderRadius: 20,
  },
  fullscreenScroll: { flex: 1 },
  fullscreenScrollContent: { paddingHorizontal: 24, paddingTop: 16 },
});

const popupStyles = StyleSheet.create({
  iconWrap: { alignItems: "center", justifyContent: "center" },
  icon: { width: 80, height: 80 },
  rateUsIcon: { width: 120, height: 120 },
  title: {
    fontSize: 28,
    fontFamily: FONTS.bold,
    lineHeight: 36,
    textAlign: "center",
    paddingHorizontal: 8,
  },
  compactTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    lineHeight: 28,
    textAlign: "center",
    paddingHorizontal: 8,
  },
  subtitle: { textAlign: "center", paddingHorizontal: 8, lineHeight: 22 },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  twoButtons: { flexDirection: "row", gap: 12, width: "100%" },
  flexBtn: { flex: 1 },
  deletePostButtons: {
    width: "100%",
    marginTop: 0,
  },
  deleteConfirmIconWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    width: 72,
    height: 72,
    alignSelf: "center",
  },
  deleteConfirmIcon: {
    width: 48,
    height: 48,
  },
  deletePostButton: {
    width: "100%",
    height: 48,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    height: 44,
    borderWidth: 1,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryCta: {
    marginTop: 12,
    alignSelf: "center",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 28,
    borderWidth: 1,
  },
});

const fullStyles = StyleSheet.create({
  title: { textAlign: "center", marginBottom: 8 },
  subtitle: { textAlign: "center", marginBottom: 24 },
  visualWrap: { alignItems: "center", marginVertical: 16 },
  centralImage: { width: 120, height: 120 },
  actions: { gap: 12, marginTop: 8 },
  button: { width: "100%" },
});
