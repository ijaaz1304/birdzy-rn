/**
 * Add note popup for saving a sound recording (Figma 8913:90836).
 */

import { CloseIcon } from "@/components/shared/CloseIcon";
import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Text } from "../../atoms";
import { FONTS } from "../../common/typography";
import { CAMERA_STRINGS } from "../../config/strings/camera.strings";
import { OVERLAY_COLORS } from "../../constants/colorConstants";
import {
  getPopupChromeStyle,
  getPopupPrimaryCtaStyle,
} from "../../design-system/modalTokens";
import { useTheme } from "../../hooks/useTheme";
import { TextArea } from "../TextArea";

export interface AddSoundNotePopupProps {
  visible: boolean;
  initialNote?: string;
  busy?: boolean;
  onClose: () => void;
  onContinue: (note: string) => void;
}

const copy = CAMERA_STRINGS.sound;

export const AddSoundNotePopup: React.FC<AddSoundNotePopupProps> = ({
  visible,
  initialNote = "",
  busy = false,
  onClose,
  onContinue,
}) => {
  const theme = useTheme();
  const colors = theme.colors;
  const radius = theme.radius;
  const [note, setNote] = useState(initialNote);

  useEffect(() => {
    if (visible) setNote(initialNote);
  }, [visible, initialNote]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      presentationStyle="overFullScreen"
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <View
            style={[
              styles.overlay,
              { backgroundColor: OVERLAY_COLORS.MODAL_BACKDROP },
            ]}
          >
            <TouchableWithoutFeedback>
              <View style={[styles.card, getPopupChromeStyle(theme)]}>
                <View style={styles.header}>
                  <Text
                    style={[styles.title, { color: colors.textPrimary }]}
                  >
                    {copy.addNoteTitle}
                  </Text>
                  <TouchableOpacity
                    onPress={onClose}
                    style={[
                      styles.closeButton,
                      {
                        backgroundColor: colors.surfaceSecondary,
                        borderRadius: radius.xl,
                      },
                    ]}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <CloseIcon isDark={false} style={styles.closeIcon} />
                  </TouchableOpacity>
                </View>

                <Text
                  style={[styles.subtitle, { color: colors.textSecondary }]}
                >
                  {copy.addNoteSubtitle}
                </Text>

                <TextArea
                  value={note}
                  onChangeText={setNote}
                  placeholder={copy.addNotePlaceholder}
                  minHeight={120}
                />

                <TouchableOpacity
                  style={[
                    styles.continue,
                    getPopupPrimaryCtaStyle(theme),
                    { borderRadius: radius.xl, opacity: busy ? 0.6 : 1 },
                  ]}
                  onPress={() => {
                    if (busy) return;
                    onContinue(note.trim());
                  }}
                  activeOpacity={0.85}
                  disabled={busy}
                >
                  <Text
                    style={[styles.continueLabel, { color: colors.onPrimary }]}
                  >
                    {busy ? "Saving..." : copy.addNoteContinue}
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  card: {
    width: "100%",
    maxWidth: 335,
    padding: 20,
    gap: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  title: {
    flex: 1,
    fontFamily: FONTS.bold,
    fontSize: 20,
    lineHeight: 28,
  },
  closeButton: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  closeIcon: {
    width: 12,
    height: 12,
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  continue: {
    width: "100%",
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  continueLabel: {
    fontFamily: FONTS.medium,
    fontSize: 16,
    lineHeight: 24,
  },
});
