/**
 * Add note popup for saving a sound recording.
 * Layout and colours follow Figma 9380:171302 (inside 9380:171250):
 * header pt20/pb16/px20 gap 8 · body px20/py4 · footer pt16/pb20/px20,
 * 335 max width, 16px radius, 1px Border-0 outline, close chip top/right 16.
 */

import { CloseIcon } from "@/components/shared/CloseIcon";
import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Text } from "../../atoms";
import { FONTS } from "../../common/typography";
import { CAMERA_STRINGS } from "../../config/strings/camera.strings";
import { OVERLAY_COLORS } from "../../constants/colorConstants";
import { useTheme } from "../../hooks/useTheme";

export interface AddSoundNotePopupProps {
  visible: boolean;
  initialNote?: string;
  busy?: boolean;
  onClose: () => void;
  onContinue: (note: string) => void;
}

const copy = CAMERA_STRINGS.sound;

/**
 * Figma 9380:171302 renders the close chip and the textarea as light fields
 * (Surface-Secondary #F6F6F6, Border-0 #E7E7E7) in both modes, and the
 * Continue button as Surface-brand 1 #785284 with no glow.
 */
const FIGMA = {
  fieldSurface: "#F6F6F6",
  /** Dark-mode note field fill — rgba(9, 27, 33, 1) / #091B21 (design request). */
  fieldSurfaceDark: "rgba(9, 27, 33, 1)",
  fieldBorder: "#E7E7E7",
  fieldText: "#091B21",
  fieldPlaceholder: "#949494",
  closeGlyph: "#5D5D5D",
  /** Dark close chip — Figma dark Surface-Secondary #091421, Border-0 #333333, white X. */
  closeSurfaceDark: "#091421",
  closeGlyphDark: "#FFFFFF",
  /** Figma renders the subtitle Text & icon-Secondary #5D5D5D in both modes. */
  subtitle: "#5D5D5D",
  brand1: "#785284",
  /** Dark-mode Continue fill — teal rgba(22, 182, 180, 1), no glow. */
  brand1Dark: "rgba(22, 182, 180, 1)",
  onBrand: "#FFFFFF",
} as const;

export const AddSoundNotePopup: React.FC<AddSoundNotePopupProps> = ({
  visible,
  initialNote = "",
  busy = false,
  onClose,
  onContinue,
}) => {
  const theme = useTheme();
  const colors = theme.colors;
  const isDark = theme.mode === "dark";
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
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 24 : 0}
      >
        <View
          style={[
            styles.overlay,
            { backgroundColor: OVERLAY_COLORS.MODAL_BACKDROP },
          ]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surfacePrimary,
                borderColor: colors.border0,
              },
            ]}
          >
            <View style={styles.header}>
              <Text
                allowFontScaling={false}
                style={[styles.title, { color: colors.textPrimary }]}
              >
                {copy.addNoteTitle}
              </Text>
              <Text
                allowFontScaling={false}
                style={styles.subtitle}
              >
                {copy.addNoteSubtitle}
              </Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.closeButton,
                isDark && {
                  backgroundColor: FIGMA.closeSurfaceDark,
                  borderColor: colors.border0,
                },
              ]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <CloseIcon
                variant="plain"
                size={16}
                color={isDark ? FIGMA.closeGlyphDark : FIGMA.closeGlyph}
              />
            </TouchableOpacity>

            <View style={styles.body}>
              <TextInput
                allowFontScaling={false}
                value={note}
                onChangeText={setNote}
                placeholder={copy.addNotePlaceholder}
                placeholderTextColor={FIGMA.fieldPlaceholder}
                multiline
                textAlignVertical="top"
                editable={!busy}
                style={[
                  styles.textArea,
                  isDark && {
                    backgroundColor: FIGMA.fieldSurfaceDark,
                    borderColor: colors.border0,
                    color: colors.textPrimary,
                  },
                ]}
              />
            </View>

            <View style={styles.footer}>
              <TouchableOpacity
                style={[
                  styles.continue,
                  {
                    backgroundColor: isDark ? FIGMA.brand1Dark : FIGMA.brand1,
                    opacity: busy ? 0.6 : 1,
                  },
                ]}
                onPress={() => {
                  if (busy) return;
                  onContinue(note.trim());
                }}
                activeOpacity={0.85}
                disabled={busy}
              >
                <Text allowFontScaling={false} style={styles.continueLabel}>
                  {busy ? "Saving..." : copy.addNoteContinue}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    zIndex: 1,
  },
  header: {
    width: "100%",
    gap: 8,
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  title: {
    // Keep clear of the 24px close chip (16 inset + 24 + 8 gap − 20 padding).
    paddingRight: 28,
    fontFamily: FONTS.bold,
    fontSize: 20,
    lineHeight: 28,
  },
  subtitle: {
    color: FIGMA.subtitle,
    fontFamily: FONTS.regular,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: -0.16,
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 24,
    height: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: FIGMA.fieldBorder,
    backgroundColor: FIGMA.fieldSurface,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  body: {
    width: "100%",
    paddingHorizontal: 20,
    paddingVertical: 4,
  },
  textArea: {
    width: "100%",
    height: 100,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: FIGMA.fieldBorder,
    backgroundColor: FIGMA.fieldSurface,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    color: FIGMA.fieldText,
    fontFamily: FONTS.regular,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: -0.16,
  },
  footer: {
    width: "100%",
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  continue: {
    width: "100%",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  continueLabel: {
    fontFamily: FONTS.medium,
    fontSize: 16,
    lineHeight: 24,
    color: FIGMA.onBrand,
  },
});
