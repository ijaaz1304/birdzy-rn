import React, { useRef, useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  StyleSheet,
  View,
  type ImageSourcePropType,
} from "react-native";
import { Text, Button } from "../../../atoms";
import { useTheme } from "../../../hooks/useTheme";
import CloseGlyph from "../../../assets/freeScanClose.svg";
import { SETTINGS_STRINGS } from "../../../config/strings/settings.strings";
import { FONTS } from "../../../common/typography";

type Props = {
  visible: boolean;
  kind: "delete" | "logout";
  icon?: ImageSourcePropType;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
};

/** Rockzy's account dialog layout, scoped to Settings account actions. */
export function SettingsAccountDialog({
  visible,
  kind,
  icon,
  onClose,
  onConfirm,
}: Props) {
  const theme = useTheme();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const inFlight = useRef(false);
  const close = () => {
    if (!inFlight.current) onClose();
  };
  const confirm = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setFailed(false);
    try {
      await onConfirm();
      onClose();
    } catch {
      setFailed(true);
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={close}
    >
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={close}
          accessibilityRole="button"
          accessibilityLabel="Dismiss confirmation"
        />
        <View
          accessibilityViewIsModal
          style={[
            styles.card,
            { backgroundColor: theme.colors.surfacePrimary },
          ]}
        >
          <View style={styles.header}>
            {kind === "delete" && icon ? (
              <Image source={icon} style={styles.icon} resizeMode="contain" />
            ) : null}
            <Text
              weight="bold"
              accessibilityRole="header"
              style={[styles.title, { color: theme.colors.textPrimary }]}
            >
              {kind === "delete"
                ? SETTINGS_STRINGS.deleteAccount.title.replace(
                    " this account?",
                    "\nthis account?"
                  )
                : SETTINGS_STRINGS.account.logOutConfirmTitle}
            </Text>
            <Pressable
              style={styles.close}
              onPress={close}
              disabled={busy}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <CloseGlyph />
            </Pressable>
          </View>
          <View style={styles.actions}>
            {failed ? (
              <Text accessibilityLiveRegion="polite" color="error">
                {kind === "delete"
                  ? "Could not delete your account. Please try again."
                  : "Could not log out. Please try again."}
              </Text>
            ) : null}
            <Button
              title={
                kind === "delete"
                  ? SETTINGS_STRINGS.deleteAccount.yes
                  : SETTINGS_STRINGS.account.logOutConfirmYes
              }
              variant="primary"
              fullWidth
              loading={busy}
              disabled={busy}
              onPress={confirm}
              style={styles.primary}
              textStyle={styles.buttonText}
            />
            <Button
              title={SETTINGS_STRINGS.account.logOutConfirmNoThanks}
              variant="ghost"
              fullWidth
              disabled={busy}
              onPress={close}
              style={[
                styles.secondary,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surfacePrimary,
                },
              ]}
              textStyle={{
                ...styles.buttonText,
                color: theme.colors.textPrimary,
              }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  card: { width: 335, maxWidth: "100%", borderRadius: 16, overflow: "hidden" },
  header: {
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
    alignItems: "center",
    gap: 8,
  },
  icon: { width: 64, height: 64 },
  title: {
    fontFamily: FONTS.bold,
    fontWeight: "700",
    fontSize: 20,
    lineHeight: 28,
    textAlign: "center",
  },
  close: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#F6F6F6",
    alignItems: "center",
    justifyContent: "center",
  },
  actions: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    gap: 12,
  },
  buttonText: {
    fontFamily: FONTS.medium,
    fontWeight: "500",
    fontSize: 16,
    lineHeight: 24,
  },
  primary: { minHeight: 48, paddingVertical: 12, borderRadius: 24 },
  secondary: {
    minHeight: 44,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
  },
});
