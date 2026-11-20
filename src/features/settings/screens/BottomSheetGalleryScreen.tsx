import { CommentActionSheet } from "../../feed/components/CommentActionSheet";
import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { ScreenContainer } from "../../../molecules/ScreenContainer/ScreenContainer";
import { Text } from "../../../atoms";
import {
  AppSheet,
  type AppSheetPayload,
  type AppSheetType,
} from "../../../components/AppSheet/AppSheet";
import { SheetPreviewProvider } from "../../../components/AppSheet/SheetPreviewContext";
import { SettingsHeader, SettingsItem, SettingsSection } from "../components";
import { useTheme } from "../../../hooks/useTheme";
import { birdsFeedConfig } from "../../feed/config";
import type { LimitType } from "../../../config/subscription.config";
import { PostActionSheet } from "../../feed/components/PostActionSheet";
import { PasswordSheet } from "../components/PasswordSheet";
import { PlanSelectorSheet } from "../../../molecules/PlanSelectorSheet/PlanSelectorSheet";
import { SwitchPlanBottomSheet } from "../../subscription/components/SwitchPlanBottomSheet";
import { ChangeLocationBottomSheet } from "../../../molecules/Modal/ChangeLocationBottomSheet";
import { RemoveFromCollectionBottomSheet } from "../../../molecules/BottomSheet/RemoveFromCollectionBottomSheet";
import { DiscountBottomSheet } from "../../../molecules/DiscountBottomSheet/DiscountBottomSheet";
import { Discount50BottomSheet } from "../../../molecules/DiscountBottomSheet/Discount50BottomSheet";

const LIMITS: Record<LimitType, string> = {
  identification: "Photo identification",
  soundIdentification: "Sound identification",
  collection: "Collection limit",
  collectionAlt: "Alternate collection limit",
  details: "Bird details",
  feed: "Feed posts",
  birdOfDay: "Bird of the Day",
  aiChat: "Ask AI",
  soundGallery: "Sound library",
};

type Registry = {
  [K in AppSheetType]: { title: string; payload: AppSheetPayload[K] };
};
type Selection =
  | { kind: "app"; type: AppSheetType; limit?: LimitType; percentage?: 50 | 70 }
  | { kind: "standalone"; id: string };

/** Every registered AppSheet type is required here, so new types cannot silently disappear. */
function buildRegistry(close: () => void): Registry {
  return {
    communityRules: {
      title: "Community rules",
      payload: { config: birdsFeedConfig, onAgree: close },
    },
    report: { title: "Report a post", payload: { onSubmit: close } },
    limitReached: {
      title: "Identification limit",
      payload: { limitType: "identification", onUpgrade: close },
    },
    createCollection: {
      title: "Create collection",
      payload: { onCreated: close },
    },
    rateUs: {
      title: "Rate Birdzy",
      payload: { onLowRating: close, onHighRating: close },
    },
    feedback: {
      title: "Send feedback",
      payload: { rating: 3, onSubmit: close },
    },
    notificationPermission: {
      title: "Enable notifications",
      payload: { onGranted: close },
    },
    locationPermission: {
      title: "Enable location",
      payload: { onSuccess: close, onRequestEnable: close },
    },
    identificationMilestone: {
      title: "Identification milestone",
      payload: { count: 10, onBackToHome: close },
    },
    subscriptionDiscount: {
      title: "50% subscription offer",
      payload: { percentage: 50, onSubscribe: close },
    },
    addToCollection: {
      title: "Add to collection",
      payload: {
        mushroomId: "preview-bird",
        onConfirm: close,
        onRequestCreateNew: close,
      },
    },
    addToAnotherCollection: {
      title: "Add to another collection",
      payload: { onConfirm: close, onRequestCreateNew: close },
    },
    moveToCollection: {
      title: "Move to collection",
      payload: { onConfirm: close, onRequestCreateNew: close },
    },
    renameCollection: {
      title: "Rename collection",
      payload: {
        collectionId: "preview-garden",
        initialName: "Garden birds",
        onRenamed: close,
      },
    },
    custom: {
      title: "Custom sheet",
      payload: {
        title: "Custom sheet",
        height: "45%",
        children: (
          <Text>Birdzy uses this sheet container for custom content.</Text>
        ),
      },
    },
  };
}

const STANDALONE = {
  commentActions: "Comment actions",
  ownPost: "Your post actions",
  otherPost: "Other post actions",
  createPassword: "Create password",
  changePassword: "Change password",
  addLocation: "Add location",
  changeLocation: "Change location",
  removeCollection: "Remove from collection",
  planSelector: "Choose subscription plan",
  switchPlan: "Switch subscription plan",
  discount50: "50% promotional sheet",
  discount70: "70% promotional sheet",
} as const;

export function BottomSheetGalleryScreen() {
  const theme = useTheme();
  const [selection, setSelection] = useState<Selection | null>(null);
  const close = React.useCallback(() => setSelection(null), []);
  const registry = useMemo(() => buildRegistry(close), [close]);
  const appSelection = selection?.kind === "app" ? selection : null;
  const id = selection?.kind === "standalone" ? selection.id : null;
  const selectedPayload = appSelection
    ? registry[appSelection.type].payload
    : undefined;
  const payload = appSelection?.limit
    ? { limitType: appSelection.limit, onUpgrade: close }
    : appSelection?.percentage
    ? { percentage: appSelection.percentage, onSubscribe: close }
    : selectedPayload;

  return (
    <SheetPreviewProvider value={true}>
      <ScreenContainer
        showBackground={false}
        backgroundColor={theme.colors.surfacePrimary}
      >
        <SettingsHeader title="Bottom sheets" />
        <ScrollView contentContainerStyle={styles.content}>
          <Text color="textSecondary" style={styles.notice}>
            Preview the app’s sheets in your current appearance. Sample actions
            won’t change your data or request permissions.
          </Text>
          <SettingsSection title="App sheets">
            {(Object.keys(registry) as AppSheetType[]).map((type) => (
              <SettingsItem
                key={type}
                title={registry[type].title}
                showArrow
                onPress={() => setSelection({ kind: "app", type })}
              />
            ))}
            <SettingsItem
              title="70% subscription offer"
              showArrow
              onPress={() =>
                setSelection({
                  kind: "app",
                  type: "subscriptionDiscount",
                  percentage: 70,
                })
              }
            />
          </SettingsSection>
          <SettingsSection title="Upgrade and limit sheets">
            {(Object.keys(LIMITS) as LimitType[]).map((limit) => (
              <SettingsItem
                key={limit}
                title={LIMITS[limit]}
                showArrow
                onPress={() =>
                  setSelection({ kind: "app", type: "limitReached", limit })
                }
              />
            ))}
          </SettingsSection>
          <SettingsSection title="More sheets">
            {Object.entries(STANDALONE).map(([key, title]) => (
              <SettingsItem
                key={key}
                title={title}
                showArrow
                onPress={() => setSelection({ kind: "standalone", id: key })}
              />
            ))}
          </SettingsSection>
        </ScrollView>
        {appSelection && (
          <AppSheet
            key={`${appSelection.type}-${
              appSelection.limit ?? appSelection.percentage ?? "base"
            }`}
            visible
            type={appSelection.type}
            payload={payload}
            onClose={close}
          />
        )}
        {(id === "ownPost" || id === "otherPost") && (
          <PostActionSheet
            visible
            isMyPost={id === "ownPost"}
            onClose={close}
            onEdit={close}
            onDelete={close}
            onHide={close}
            onReport={close}
          />
        )}
        {(id === "createPassword" || id === "changePassword") && (
          <PasswordSheet
            visible
            mode={id === "createPassword" ? "create" : "change"}
            onClose={close}
            onSubmit={async () => close()}
          />
        )}
        {(id === "addLocation" || id === "changeLocation") && (
          <ChangeLocationBottomSheet
            visible
            variant={id === "addLocation" ? "add" : "custom"}
            onClose={close}
            onConfirm={close}
          />
        )}
        {id === "commentActions" && (
          <CommentActionSheet
            visible
            onClose={close}
            onCopy={close}
            onReply={close}
          />
        )}
        {id === "removeCollection" && (
          <RemoveFromCollectionBottomSheet
            visible
            mushroomId="preview-bird"
            mushroomName="House Sparrow"
            onClose={close}
            onSuccess={close}
          />
        )}
        {id === "planSelector" && (
          <PlanSelectorSheet
            visible
            onClose={close}
            onSubscribe={async () => close()}
          />
        )}
        {id === "switchPlan" && (
          <SwitchPlanBottomSheet
            visible
            currentPlanKind="year"
            onClose={close}
            onSubscribe={async () => close()}
            onDowngrade={async () => close()}
          />
        )}
        {id === "discount50" && (
          <Discount50BottomSheet
            visible
            durationSeconds={3600}
            onClose={close}
            onCTAPress={close}
          />
        )}
        {id === "discount70" && (
          <DiscountBottomSheet
            visible
            percentage={70}
            durationSeconds={3600}
            onClose={close}
            onCTAPress={close}
          />
        )}
      </ScreenContainer>
    </SheetPreviewProvider>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 24, paddingBottom: 40 },
  notice: { fontSize: 14, lineHeight: 20 },
});
