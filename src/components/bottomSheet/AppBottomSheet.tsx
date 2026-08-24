/**
 * Standard bottom sheet: overlay + card surface, rounded top, 44x44 close.
 * Use for: Create collection, Select collection, Remove from collection, Add to collection.
 * Theme overlay, cardBackground, radius; scrollable content; optional keyboard-safe.
 */

import { CloseIcon } from "@/components/shared/CloseIcon";
import React from "react";
import { View, StyleSheet, Modal, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, useIsDark } from "../../hooks/useTheme";
import { MODAL, getBottomSheetChromeStyle } from "../../design-system/modalTokens";
import { HIT_SLOP } from "../../constants/uiConstants";

const CLOSE_HIT_SLOP = HIT_SLOP.CLOSE;

export interface AppBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  keyboardSafe?: boolean;
}

export const AppBottomSheet: React.FC<AppBottomSheetProps> = ({
  visible,
  onClose,
  children,
  keyboardSafe = false,
}) => {
  const theme = useTheme();
  const colors = theme.colors;
  const isDark = useIsDark();
  const radius = theme.radius;
  const spacing = theme.spacing;
  const insets = useSafeAreaInsets();

  const content = (
    <>
      <TouchableOpacity
        style={[
          styles.closeBtn,
          {
            top: insets.top + spacing[2],
            right: spacing[4],
            minWidth: MODAL.closeMinSize,
            minHeight: MODAL.closeMinSize,
          },
        ]}
        onPress={onClose}
        activeOpacity={0.8}
        hitSlop={CLOSE_HIT_SLOP}
        accessibilityRole="button"
        accessibilityLabel="Close"
      >
        <CloseIcon isDark={isDark} />
      </TouchableOpacity>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + spacing[6] },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
        <View
          style={[
            styles.sheet,
            getBottomSheetChromeStyle(theme),
            {
              backgroundColor: colors.cardBackground,
              paddingHorizontal: spacing[6],
              maxHeight: "92%",
            },
          ]}
        >
          {keyboardSafe ? (
            <KeyboardAvoidingView
              style={styles.flex}
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              keyboardVerticalOffset={0}
            >
              {content}
            </KeyboardAvoidingView>
          ) : (
            content
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    width: "100%",
    overflow: "hidden",
  },
  flex: {
    flex: 1,
  },
  closeBtn: {
    position: "absolute",
    zIndex: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
  },
});
