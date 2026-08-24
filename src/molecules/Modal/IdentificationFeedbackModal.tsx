/**
 * Identification Feedback Modal
 * Collects user feedback on identification accuracy.
 * Renders as a bottom sheet everywhere (diagnosis result, mineral details, etc.).
 */

import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useTheme, useIsDark } from "../../hooks/useTheme";
import { Text } from "../../atoms";
import { BottomSheetWithHeader } from "./BottomSheetWithHeader";
import { ModalBackgroundSvg } from "./ModalBackgroundSvg";
import { Card } from "../Card";
import { APP_COLORS } from "../../config/colors";
import { getDarkPopupBorderStyle } from "../../design-system/modalTokens";
import { MODAL_STRINGS } from "../../config/strings/modals.strings";
import { SUBSCRIPTION_COLORS } from "../../constants/colorConstants";

import { Radius } from "../../design";

import { spacing } from "../../design-system/spacing";

export interface IdentificationFeedbackModalProps {
  visible: boolean;
  onClose: () => void;
  /** Can be sync or async; modal awaits and shows Sending… until complete. */
  onSubmit: (feedback: {
    rating: number;
    comment?: string;
  }) => void | Promise<void>;
  mushroomName?: string;
}

export const IdentificationFeedbackModal: React.FC<
  IdentificationFeedbackModalProps
> = ({ visible, onClose, onSubmit }) => {
  const theme = useTheme();
  const colors = theme.colors;
  const _spacing = theme.spacing;
  const radius = theme.radius;
  const isDark = useIsDark();

  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (selectedRating === null || submitting) return;
    setSubmitting(true);
    try {
      await Promise.resolve(
        onSubmit({
          rating: selectedRating,
          comment: message.trim() || undefined,
        })
      );
      setIsSubmitted(true);
      setTimeout(() => {
        setSelectedRating(null);
        setMessage("");
        setIsSubmitted(false);
        onClose();
      }, 2000);
    } catch {
      // Parent shows error toast/alert; keep modal open so user can retry
    } finally {
      setSubmitting(false);
    }
  };

  const emojiRatings = [
    { value: 1, emoji: "😢" },
    { value: 2, emoji: "😞" },
    { value: 3, emoji: "😐" },
    { value: 4, emoji: "😊" },
    { value: 5, emoji: "🤩" },
  ];

  return (
    <BottomSheetWithHeader
      visible={visible}
      onClose={onClose}
      useLittleBg
      keyboardSafe
      debugName="IdentificationFeedbackModal"
    >
      {isSubmitted ? (
        <View style={[styles.cardWrapper, getDarkPopupBorderStyle(theme)]}>
          <ModalBackgroundSvg
            variant="50"
            dark={isDark}
            style={styles.backgroundImage}
          />
          <Card
            padding="large"
            variant="elevated"
            style={[styles.card, { backgroundColor: "transparent" }]}
          >
            <View style={styles.confirmationContainer}>
              <View
                style={[
                  styles.checkmarkContainer,
                  { backgroundColor: colors.success },
                ]}
              >
                <MaterialIcons
                  name="check"
                  size={40}
                  color={theme.colors.textInverse}
                />
              </View>
              <Text
                variant="headline"
                size="large"
                weight="bold"
                style={styles.confirmationTitle}
              >
                {MODAL_STRINGS.identificationFeedback.confirmationTitle}
              </Text>
              <Text
                variant="body"
                size="medium"
                color="textSecondary"
                style={styles.confirmationSubtitle}
              >
                {MODAL_STRINGS.identificationFeedback.confirmationSubtitle}
              </Text>
            </View>
          </Card>
        </View>
      ) : (
        <View style={[styles.cardWrapper, getDarkPopupBorderStyle(theme)]}>
          <ModalBackgroundSvg
            variant="50"
            dark={isDark}
            style={styles.backgroundImage}
          />
          <Card
            padding="large"
            variant="elevated"
            style={[styles.card, { backgroundColor: "transparent" }]}
          >
            <Text
              variant="headline"
              size="large"
              weight="bold"
              style={styles.title}
            >
              {MODAL_STRINGS.identificationFeedback.title}
            </Text>
            <Text
              variant="body"
              size="medium"
              color="textSecondary"
              style={styles.subtitle}
            >
              {MODAL_STRINGS.identificationFeedback.subtitle}
            </Text>

            <View style={styles.emojiContainer}>
              {emojiRatings.map((rating) => (
                <TouchableOpacity
                  key={rating.value}
                  style={[
                    styles.emojiButton,
                    selectedRating === rating.value && {
                      backgroundColor: APP_COLORS.modalEmojiSelectedBg,
                      borderRadius: radius.full,
                    },
                  ]}
                  onPress={() => setSelectedRating(rating.value)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.emoji}>{rating.emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.messageContainer}>
              <Text
                variant="body"
                size="small"
                weight="medium"
                style={styles.messageLabel}
              >
                Message
              </Text>
              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder="Leave a message"
                placeholderTextColor={colors.textTertiary}
                multiline
                style={[
                  styles.messageInput,
                  {
                    backgroundColor: colors.surfacePrimary,
                    borderColor: colors.border,
                    color: colors.textPrimary,
                    borderRadius: radius.md,
                  },
                ]}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.submitButton,
                {
                  backgroundColor: isDark
                    ? SUBSCRIPTION_COLORS.CTA_PRIMARY_DARK
                    : SUBSCRIPTION_COLORS.CTA_PRIMARY_LIGHT,
                  borderRadius: radius.full,
                  opacity: selectedRating !== null && !submitting ? 1 : 0.5,
                },
              ]}
              onPress={handleSubmit}
              disabled={selectedRating === null || submitting}
              activeOpacity={0.8}
            >
              {submitting ? (
                <View style={styles.submitButtonContent}>
                  <ActivityIndicator
                    size="small"
                    color={
                      isDark
                        ? SUBSCRIPTION_COLORS.CTA_TEXT_DARK
                        : SUBSCRIPTION_COLORS.CTA_TEXT_LIGHT
                    }
                    style={styles.submitSpinner}
                  />
                  <Text
                    variant="label"
                    size="medium"
                    weight="semibold"
                    style={{
                      color: isDark
                        ? SUBSCRIPTION_COLORS.CTA_TEXT_DARK
                        : SUBSCRIPTION_COLORS.CTA_TEXT_LIGHT,
                    }}
                  >
                    {MODAL_STRINGS.identificationFeedback.sending}
                  </Text>
                </View>
              ) : (
                <Text
                  variant="label"
                  size="medium"
                  weight="semibold"
                  style={{
                    color: isDark
                      ? SUBSCRIPTION_COLORS.CTA_TEXT_DARK
                      : SUBSCRIPTION_COLORS.CTA_TEXT_LIGHT,
                  }}
                >
                  {MODAL_STRINGS.identificationFeedback.submit}
                </Text>
              )}
            </TouchableOpacity>
          </Card>
        </View>
      )}
    </BottomSheetWithHeader>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    position: "relative",
    overflow: "hidden",
  },
  backgroundImage: {
    position: "absolute",
    width: "100%",
    height: "100%",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  card: {
    maxHeight: "80%",
    zIndex: 1,
  },
  title: {
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    marginBottom: 24,
    textAlign: "center",
  },
  emojiContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  emojiButton: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  emoji: {
    fontSize: 32,
  },
  messageContainer: {
    marginBottom: 24,
  },
  messageLabel: {
    marginBottom: 8,
  },
  messageInput: {
    minHeight: 100,
    padding: spacing[4],
    borderWidth: 1,
    textAlignVertical: "top",
    fontSize: 16,
  },
  submitButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: "center",
    alignSelf: "flex-end",
  },
  submitButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  submitSpinner: {
    marginRight: 8,
  },
  confirmationContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
  },
  checkmarkContainer: {
    width: 80,
    height: 80,
    borderRadius: Radius.lg,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  confirmationTitle: {
    marginBottom: 8,
    textAlign: "center",
  },
  confirmationSubtitle: {
    textAlign: "center",
  },
});
