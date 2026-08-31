/**
 * Bottom-nav FTUE tooltip (first sign-up or continue-as-guest only).
 * Sequence: Catalogue → Identify (Camera tab) → Collection → Feed.
 * App lands on Home; all steps overlay Home (no tab navigation).
 */

import React, { useState, useEffect, useRef, useMemo } from "react";
import { View, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, Animated, Platform, useWindowDimensions } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { Text } from "../../atoms";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MODAL_STRINGS } from "../../config/strings/modals.strings";
import { HIT_SLOP } from "../../constants";
import { UI_STATE_KEYS } from "../../constants/storageConstants";
import { FONTS } from "../../common/typography";
import { APP_COLORS } from "../../config/colors";
import { spacing } from "../../design-system/spacing";
import { useTabBarLayoutOptional } from "../../contexts/TabBarLayoutContext";
import { useIdentificationEntryStore } from "../../features/camera/identificationEntry.store";

/** Match CustomBottomTabBar `paddingHorizontal` (fallback geometry only) */
const TAB_BAR_H_PADDING = spacing[2];
const TOOLTIP_BOTTOM_OFFSET = 88;
const TOOLTIP_STORAGE_KEY = UI_STATE_KEYS.APP_LOGS_TOOLTIP_SHOWN;
export const TOOLTIP_ELIGIBLE_FOR_SIGNUP_KEY =
  "app_logs_tooltip_eligible_signup";

export const isTooltipPending = async (): Promise<boolean> => {
  try {
    const shown = await AsyncStorage.getItem(TOOLTIP_STORAGE_KEY);
    const eligible = await AsyncStorage.getItem(
      TOOLTIP_ELIGIBLE_FOR_SIGNUP_KEY
    );
    return eligible === "true" && shown !== "true";
  } catch {
    return false;
  }
};

const TOOLTIP_WIDTH = 232;
const TOOLTIP_EDGE_PADDING_X = { left: 6, right: 12 };
const TAB_BAR_COUNT = 5;
const TOOLTIP_TABS = ["Catalogue", "Camera", "Collection", "Feed"] as const;
export type TooltipTabName = (typeof TOOLTIP_TABS)[number];

/** Tab that should be visible behind the tooltip for each step (Camera highlights FAB while on Catalogue). */
function getBackdropTabForStep(
  tab: TooltipTabName
): Exclude<TooltipTabName, "Camera"> | "Catalogue" {
  return tab === "Camera" ? "Catalogue" : tab;
}

/** Whether the tooltip for the current step can render on this tab. */
function canShowStepOnTab(
  backdropTab: ReturnType<typeof getBackdropTabForStep>,
  currentTab: AppLogsTooltipProps["currentTab"]
): boolean {
  if (currentTab === backdropTab) return true;
  // Entire tour overlays Home — bubbles point at bottom-nav tabs without leaving Home.
  if (currentTab === "Home") return true;
  return false;
}

/** Center X of the Home tab (index 0) when measureInWindow is unavailable */
function fallbackTabCenterX(
  tabName: "Home" | "Catalogue" | "Camera" | "Collection" | "Feed",
  windowWidth: number
): number {
  const tabIndexMap = {
    Home: 0,
    Catalogue: 1,
    Camera: 2,
    Feed: 3,
    Collection: 4,
  } as const;
  const tabIndex = tabIndexMap[tabName];
  const innerBarWidth = windowWidth - 2 * TAB_BAR_H_PADDING;
  const tabSlotWidth = innerBarWidth / TAB_BAR_COUNT;
  return TAB_BAR_H_PADDING + tabSlotWidth * tabIndex + tabSlotWidth / 2;
}

export interface AppLogsTooltipProps {
  currentTab: "Home" | "Catalogue" | "Camera" | "Collection" | "Feed";
  /** True when the active tab is on its root screen (not a detail / modal route). */
  ftueActive: boolean;
  onComplete?: () => void;
  onVisibleChange?: (visible: boolean) => void;
}

export const AppLogsTooltip: React.FC<AppLogsTooltipProps> = ({
  currentTab,
  ftueActive,
  onComplete,
  onVisibleChange,
}) => {
  const theme = useTheme();
  const colors = theme.colors;
  const isDark = theme.mode === "dark";
  const tooltipBg = isDark ? APP_COLORS.surfaceDark : APP_COLORS.surfaceWhite;
  const tooltipTextColor = isDark
    ? APP_COLORS.tooltipTextLight
    : APP_COLORS.tooltipTextDark;
  const [visible, setVisible] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const strings = MODAL_STRINGS.appLogsTooltip;
  const { width: windowWidth } = useWindowDimensions();
  const tabBarLayout = useTabBarLayoutOptional();

  const [layoutTick, setLayoutTick] = useState(0);
  const pendingShowRef = useRef(false);

  const activeTab: TooltipTabName = TOOLTIP_TABS[stepIndex];
  const backdropTab = getBackdropTabForStep(activeTab);

  const stepVisibleOnCurrentTab = canShowStepOnTab(backdropTab, currentTab);

  useEffect(() => {
    const checkIfShown = async () => {
      try {
        const shown = await AsyncStorage.getItem(TOOLTIP_STORAGE_KEY);
        const eligibleForSignup = await AsyncStorage.getItem(
          TOOLTIP_ELIGIBLE_FOR_SIGNUP_KEY
        );
        const shouldRun = shown !== "true" && eligibleForSignup === "true";

        if (!shouldRun) {
          pendingShowRef.current = false;
          setVisible(false);
          onVisibleChange?.(false);
          opacityAnim.setValue(0);
          return;
        }

        if (!ftueActive) {
          setVisible(false);
          onVisibleChange?.(false);
          opacityAnim.setValue(0);
          return;
        }

        pendingShowRef.current = true;

        const entryStore = useIdentificationEntryStore.getState();
        if (entryStore.pendingFromBottomTab && activeTab !== "Catalogue") {
          return;
        }

        if (!stepVisibleOnCurrentTab) {
          // Stay on the current screen — never auto-switch tabs for FTUE.
          setVisible(false);
          onVisibleChange?.(false);
          opacityAnim.setValue(0);
          return;
        }

        setVisible(true);
        onVisibleChange?.(true);
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      } catch (error) {
        console.error("Error checking tooltip status:", error);
      }
    };
    void checkIfShown();
  }, [
    activeTab,
    currentTab,
    ftueActive,
    stepVisibleOnCurrentTab,
    onVisibleChange,
    opacityAnim,
  ]);

  useEffect(() => {
    if (!visible) {
      return;
    }
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setLayoutTick((t) => t + 1));
    });
    return () => cancelAnimationFrame(id);
  }, [visible, windowWidth]);

  const handleDismiss = async () => {
    await markAsShown();
    pendingShowRef.current = false;
    setVisible(false);
    setStepIndex(0);
    onVisibleChange?.(false);
    onComplete?.();
  };

  const handleNext = () => {
    if (stepIndex >= TOOLTIP_TABS.length - 1) {
      void handleDismiss();
      return;
    }
    setStepIndex(stepIndex + 1);
  };

  const handleBack = () => {
    if (stepIndex <= 0) return;
    setStepIndex(stepIndex - 1);
  };

  const markAsShown = async () => {
    try {
      await AsyncStorage.setItem(TOOLTIP_STORAGE_KEY, "true");
      await AsyncStorage.removeItem(TOOLTIP_ELIGIBLE_FOR_SIGNUP_KEY);
    } catch (error) {
      console.error("Error marking tooltip as shown:", error);
    }
  };

  const measuredCenterX = tabBarLayout?.tabCentersX[activeTab];
  const tabCenterX = useMemo(() => {
    let x: number;
    if (
      typeof measuredCenterX === "number" &&
      Number.isFinite(measuredCenterX)
    ) {
      x = measuredCenterX;
    } else {
      x = fallbackTabCenterX(activeTab, windowWidth);
    }
    return x;
  }, [measuredCenterX, windowWidth, activeTab, layoutTick]);

  const tooltipLeft = useMemo(
    () =>
      Math.max(
        TOOLTIP_EDGE_PADDING_X.left,
        Math.min(
          tabCenterX - TOOLTIP_WIDTH / 2,
          windowWidth - TOOLTIP_WIDTH - TOOLTIP_EDGE_PADDING_X.right
        )
      ),
    [tabCenterX, windowWidth]
  );

  if (!visible) return null;

  const tabCopy = strings.tabs[activeTab];
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === TOOLTIP_TABS.length - 1;

  return (
    <Animated.View
      style={[styles.overlay, { opacity: opacityAnim }]}
      pointerEvents="box-none"
    >
      <View
        style={[
          styles.dimmedBackground,
          { backgroundColor: colors.overlayDark },
        ]}
        pointerEvents="none"
      />
      <TouchableWithoutFeedback onPress={handleDismiss}>
        <View style={styles.dismissHitArea} />
      </TouchableWithoutFeedback>

      <View
        style={[
          styles.tooltip,
          {
            left: tooltipLeft,
            width: TOOLTIP_WIDTH,
            bottom: TOOLTIP_BOTTOM_OFFSET,
          },
        ]}
      >
        <View
          style={[
            styles.tooltipContent,
            {
              backgroundColor: tooltipBg,
              borderRadius: 20,
              overflow: "hidden",
              ...(Platform.OS === "ios"
                ? {
                    shadowColor: "#FFFFFF",
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.25,
                    shadowRadius: 8,
                  }
                : { elevation: 8 }),
            },
          ]}
        >
          <Text
            variant="body"
            size="small"
            style={[
              styles.tooltipSubtitle,
              { fontSize: 11, color: tooltipTextColor },
            ]}
          >
            {tabCopy?.subtitle ?? ""}
          </Text>
          <View style={styles.bubbleActions}>
            <TouchableOpacity
              onPress={isFirstStep ? handleDismiss : handleBack}
              hitSlop={HIT_SLOP.CLOSE}
              activeOpacity={0.7}
              style={styles.bubbleBtn}
            >
              <Text
                variant="body"
                size="small"
                weight="semibold"
                style={[styles.bubbleBtnText, { color: tooltipTextColor }]}
              >
                {isFirstStep ? strings.skipButton : strings.backButton}
              </Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
            <TouchableOpacity
              onPress={handleNext}
              hitSlop={HIT_SLOP.CLOSE}
              activeOpacity={0.7}
              style={styles.bubbleBtn}
            >
              <Text
                variant="body"
                size="small"
                weight="semibold"
                style={[styles.bubbleBtnText, { color: tooltipTextColor }]}
              >
                {isLastStep ? strings.gotItButton : strings.nextButton}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9998,
  },
  dimmedBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  dismissHitArea: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9998,
  },
  tooltip: {
    position: "absolute",
    zIndex: 9999,
    overflow: "visible",
  },
  tooltipContent: {
    padding: 12,
    alignItems: "center",
  },
  tooltipSubtitle: {
    marginBottom: 10,
    textAlign: "center",
  },
  bubbleActions: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginTop: 4,
  },
  bubbleBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  bubbleBtnText: {
    fontFamily: FONTS.bold,
  },
});
