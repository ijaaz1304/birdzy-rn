/**
 * Report Modal — Figma-aligned layout for post and mushroom reports.
 */

import { CloseIcon } from "@/components/shared/CloseIcon";
import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback, TextInput } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { UI_COLORS } from "../../constants/colorConstants";
import { Text } from "../../atoms";
import { Button } from "../../atoms";
import { MODAL_STRINGS } from "../../config/strings/modals.strings";
import { FONTS } from "../../common/typography";
import { dismissKeyboardSmooth } from "../../utils/dismissKeyboardSmooth";
import { getPopupChromeStyle, getPopupPrimaryCtaStyle } from "../../design-system/modalTokens";

import { spacing } from "../../design-system/spacing";

/** Brief pause after keyboard hide — avoids parent KeyboardAvoidingView keeping bottom inset. */
const KEYBOARD_LAYOUT_SETTLE_MS = 80;
/** Keep parent keyboard avoidance disabled briefly after close (see MushroomDetailsScreen). */
export const REPORT_MODAL_KEYBOARD_COOLDOWN_MS = 450;

const POST_COPY = MODAL_STRINGS.modals.reportPost;
const BIRD_COPY = MODAL_STRINGS.modals.reportBird;

export type ReportModalVariant = "post" | "mushroom";

export interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit?: (message: string) => void | Promise<void>;
  plantName?: string;
  /** Override title (e.g. "Report this post" for feed). */
  title?: string;
  /** Override description. */
  description?: string;
  /** Override input placeholder. */
  placeholder?: string;
  /** Override submit button label. */
  submitLabel?: string;
  /** Preset copy for post vs mushroom report flows. */
  variant?: ReportModalVariant;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  visible,
  onClose,
  onSubmit,
  title: titleProp,
  description: descriptionProp,
  placeholder: placeholderProp,
  submitLabel: submitLabelProp,
  variant = "mushroom",
}) => {
  const theme = useTheme();
  const colors = theme.colors;
  const radius = theme.radius;
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textInputRef = useRef<TextInput>(null);

  const preset = variant === "post" ? POST_COPY : BIRD_COPY;
  const title = titleProp ?? preset.title;
  const description = descriptionProp ?? preset.description;
  const placeholder = placeholderProp ?? preset.placeholder;
  const submitLabel = submitLabelProp ?? preset.submitButton;

  useEffect(() => {
    if (!visible) {
      setMessage("");
      setIsSubmitting(false);
    }
  }, [visible]);

  const handleSubmit = async () => {
    const trimmed = message.trim();
    if (!trimmed || isSubmitting) return;
    setIsSubmitting(true);
    try {
      textInputRef.current?.blur();
      await dismissKeyboardSmooth();
      await new Promise((resolve) =>
        setTimeout(resolve, KEYBOARD_LAYOUT_SETTLE_MS)
      );
      await Promise.resolve(onSubmit?.(trimmed));
      setMessage("");
      await new Promise((resolve) =>
        setTimeout(resolve, KEYBOARD_LAYOUT_SETTLE_MS)
      );
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = async () => {
    if (isSubmitting) return;
    textInputRef.current?.blur();
    await dismissKeyboardSmooth();
    await new Promise((resolve) =>
      setTimeout(resolve, KEYBOARD_LAYOUT_SETTLE_MS)
    );
    setMessage("");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        void handleClose();
      }}
      statusBarTranslucent
      presentationStyle="overFullScreen"
    >
      <View style={[styles.container, { zIndex: 9998, elevation: 9998 }]}>
        <TouchableWithoutFeedback
          onPress={() => {
            void handleClose();
          }}
        >
          <View
            style={[styles.backdrop, { backgroundColor: colors.overlay }]}
          />
        </TouchableWithoutFeedback>

        <View
          style={[
            styles.modalContent,
            getPopupChromeStyle(theme),
          ]}
        >
          <TouchableOpacity
            onPress={() => {
              void handleClose();
            }}
            style={[
              styles.closeButton,
              {
                backgroundColor: colors.surfaceSecondary,
                borderRadius: radius.xl,
              },
            ]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <CloseIcon isDark={theme.mode === "dark"} style={styles.closeIcon} />
          </TouchableOpacity>

          <View style={styles.body}>
            <Text
              variant="headline"
              size="medium"
              weight="bold"
              style={[styles.title, { color: colors.textPrimary }]}
            >
              {title}
            </Text>

            <Text
              variant="body"
              size="small"
              style={[styles.description, { color: colors.textSecondary }]}
            >
              {description}
            </Text>

            <TextInput
              ref={textInputRef}
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.surfaceVariant,
                  color: colors.textPrimary,
                  borderRadius: radius.md,
                  borderColor: colors.border,
                },
              ]}
              placeholder={placeholder}
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={6}
              value={message}
              onChangeText={setMessage}
              textAlignVertical="top"
            />

            <Button
              title={submitLabel}
              variant="primary"
              size="large"
              fullWidth
              onPress={handleSubmit}
              disabled={isSubmitting || !message.trim()}
              loading={isSubmitting}
              style={[styles.submitButton, getPopupPrimaryCtaStyle(theme)]}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    width: "100%",
    maxWidth: 335,
    position: "relative",
    shadowColor: UI_COLORS.SHADOW,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  closeIcon: {
    width: 12,
    height: 12,
  },
  body: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  title: {
    textAlign: "center",
    fontFamily: FONTS.bold,
    fontSize: 20,
    lineHeight: 28,
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  description: {
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  textInput: {
    minHeight: 120,
    padding: spacing[4],
    fontSize: 16,
    borderWidth: 1,
    textAlignVertical: "top",
    marginBottom: 16,
  },
  submitButton: {
    marginBottom: 0,
  },
});
