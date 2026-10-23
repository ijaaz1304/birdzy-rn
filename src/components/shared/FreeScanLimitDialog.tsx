import React, { useEffect, useRef, useSyncExternalStore } from "react";
import {
  InteractionManager,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import FreeScanClose from "../../assets/freeScanClose.svg";
import {
  dismissFreeScanLimitPrompt,
  getFreeScanPromptSurfaceActive,
  getFreeScanLimitIntroduction,
  getFreeScanLimitPrompt,
  subscribeFreeScanLimitPrompt,
} from "../../services/freeScanLimitPrompt";

type Props = { active: boolean; isPremium: boolean; onUpgrade: () => void };

/** Figma 8207:15429. Shown once on first camera entry and again when the allowance is exhausted. */
export function FreeScanLimitDialog({ active, isPremium, onUpgrade }: Props) {
  const surfaceActive = useSyncExternalStore(
    subscribeFreeScanLimitPrompt,
    getFreeScanPromptSurfaceActive
  );
  const canPresent = active && surfaceActive;
  const requested = useSyncExternalStore(
    subscribeFreeScanLimitPrompt,
    getFreeScanLimitPrompt
  );
  const introduction = useSyncExternalStore(
    subscribeFreeScanLimitPrompt,
    getFreeScanLimitIntroduction
  );
  const upgradePending = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [presented, setPresented] = React.useState(false);
  useEffect(() => {
    if (isPremium) dismissFreeScanLimitPrompt();
    if (!requested || !canPresent || isPremium) {
      setPresented(false);
      return;
    }
    const task = InteractionManager.runAfterInteractions(() =>
      setPresented(true)
    );
    return () => task.cancel();
  }, [requested, canPresent, isPremium]);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );
  const close = () => {
    setPresented(false);
    dismissFreeScanLimitPrompt();
  };
  const finishUpgrade = () => {
    if (!upgradePending.current) return;
    upgradePending.current = false;
    onUpgrade();
  };
  const upgrade = () => {
    if (upgradePending.current) return;
    upgradePending.current = true;
    close();
    if (Platform.OS !== "ios") timer.current = setTimeout(finishUpgrade, 350);
  };
  return (
    <Modal
      visible={presented && requested && canPresent && !isPremium}
      transparent
      animationType="fade"
      onRequestClose={close}
      onDismiss={finishUpgrade}
    >
      <Pressable
        style={styles.backdrop}
        onPress={close}
        accessibilityLabel="Dismiss free scan limit"
      >
        <Pressable
          style={styles.card}
          onPress={(event) => event.stopPropagation()}
          accessibilityViewIsModal
        >
          <View style={styles.header}>
            <Text style={styles.title}>Free scan limit</Text>
            <Text style={styles.description}>
              {introduction
                ? "Free users get 30 scans in total. For unlimited scans, Go Premium"
                : "You’ve used all 30 free scans. For unlimited scans, Go Premium"}
            </Text>
          </View>
          <Pressable
            style={styles.close}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Close"
            onPress={close}
          >
            <FreeScanClose />
          </Pressable>
          <View style={styles.footer}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go Premium"
              style={[styles.button, styles.primary]}
              onPress={upgrade}
            >
              <Text style={[styles.buttonText, styles.primaryText]}>
                Go Premium
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Not Now"
              style={[styles.button, styles.secondary]}
              onPress={close}
            >
              <Text style={styles.buttonText}>Not Now</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 335,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, gap: 8 },
  title: {
    fontFamily: "Satoshi-Bold",
    fontSize: 20,
    lineHeight: 28,
    textAlign: "center",
    paddingHorizontal: 20,
    color: "#111111",
  },
  description: {
    fontFamily: "Satoshi-Regular",
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: -0.16,
    textAlign: "center",
    color: "#5D5D5D",
  },
  close: {
    position: "absolute",
    right: 16,
    top: 16,
    width: 24,
    height: 24,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F6F6F6",
  },
  footer: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20, gap: 12 },
  button: {
    minHeight: 44,
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  primary: { backgroundColor: "#0C2A45" },
  secondary: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E7E7E7",
  },
  buttonText: {
    fontFamily: "Satoshi-Medium",
    fontSize: 16,
    lineHeight: 24,
    color: "#111111",
  },
  primaryText: { color: "#FFFFFF" },
});
