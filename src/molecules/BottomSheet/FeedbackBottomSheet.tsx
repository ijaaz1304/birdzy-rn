/**
 * Feedback Bottom Sheet
 */

import React, { useState } from "react";
import { View, StyleSheet, TextInput, KeyboardAvoidingView, Platform } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { APP_COLORS } from "../../config/colors";
import { Text, Button } from "../../atoms";
import { BottomSheet } from "../../components/bottomSheet";
import {
  FEEDBACK_MESSAGE_MAX_LENGTH,
  MODAL_STRINGS,
} from "../../config/strings/modals.strings";

export interface FeedbackBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    email: string;
    feedback: string;
    rating?: number;
  }) => void;
  rating?: number;
}

export const FeedbackBottomSheet: React.FC<FeedbackBottomSheetProps> = ({
  visible,
  onClose,
  onSubmit,
  rating,
}) => {
  const theme = useTheme();
  const colors = theme.colors;
  const spacing = theme.spacing;
  const radius = theme.radius;
  const strings = MODAL_STRINGS.bottomSheets.feedback;
  const feedbackStrings = MODAL_STRINGS.feedbackModal;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [feedback, setFeedback] = useState("");

  const isValid = feedback.length >= 10;
  const isEmailValid = email === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const canSubmit = isValid && isEmailValid;

  const handleSubmit = () => {
    onSubmit({ name, email, feedback, rating });
    setName("");
    setEmail("");
    setFeedback("");
    onClose();
  };

  return (
    <BottomSheet visible={visible} heightPercent={70} onClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <Text
          variant="title"
          size="large"
          weight="semibold"
          style={styles.title}
        >
          {strings.title}
        </Text>
        <Text
          variant="body"
          size="medium"
          color="textSecondary"
          style={styles.subtitle}
        >
          {strings.subtitle}
        </Text>

        <TextInput
          placeholder={feedbackStrings.namePlaceholder}
          placeholderTextColor={colors.textTertiary}
          style={[
            styles.input,
            {
              borderColor: colors.border,
              color: colors.textPrimary,
              backgroundColor: colors.surfaceSecondary,
              borderRadius: radius.md,
              paddingHorizontal: spacing[4],
              paddingVertical: spacing[3],
              marginTop: spacing[4],
            },
          ]}
          value={name}
          onChangeText={setName}
        />

        <TextInput
          placeholder={feedbackStrings.emailPlaceholderOptional}
          placeholderTextColor={colors.textTertiary}
          style={[
            styles.input,
            {
              borderColor: colors.border,
              color: colors.textPrimary,
              backgroundColor: colors.surfaceSecondary,
              borderRadius: radius.md,
              paddingHorizontal: spacing[4],
              paddingVertical: spacing[3],
              marginTop: spacing[3],
            },
          ]}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          placeholder={feedbackStrings.feedbackPlaceholderLong}
          placeholderTextColor={colors.textTertiary}
          style={[
            styles.input,
            styles.textArea,
            {
              borderColor: colors.border,
              color: colors.textPrimary,
              backgroundColor: colors.surfaceSecondary,
              borderRadius: radius.md,
              paddingHorizontal: spacing[4],
              paddingVertical: spacing[3],
              marginTop: spacing[3],
              minHeight: 100,
            },
          ]}
          value={feedback}
          onChangeText={setFeedback}
          multiline
          maxLength={FEEDBACK_MESSAGE_MAX_LENGTH}
          textAlignVertical="top"
        />
        <Text
          variant="body"
          size="small"
          color="textSecondary"
          style={{ marginTop: spacing[1], alignSelf: "flex-end" }}
        >
          {feedback.length}/{FEEDBACK_MESSAGE_MAX_LENGTH}
        </Text>

        {feedback.length > 0 && feedback.length < 10 && (
          <Text
            variant="body"
            size="small"
            color="error"
            style={{ marginTop: spacing[1] }}
          >
            {feedbackStrings.feedbackMinError}
          </Text>
        )}

        {email.length > 0 && !isEmailValid && (
          <Text
            variant="body"
            size="small"
            color="error"
            style={{ marginTop: spacing[1] }}
          >
            {feedbackStrings.emailInvalidError}
          </Text>
        )}

        <View style={styles.actions}>
          <Button
            title={strings.cancelButton}
            variant="outline"
            size="large"
            onPress={onClose}
            style={{
              ...StyleSheet.flatten(styles.button),
              borderColor:
                theme.mode === "dark"
                  ? APP_COLORS.cancelSecondaryBorderDark
                  : APP_COLORS.cancelSecondaryBorderLight,
            }}
          />
          <Button
            title={strings.submitButton}
            variant="primary"
            size="large"
            onPress={handleSubmit}
            disabled={!canSubmit}
            style={styles.button}
          />
        </View>
      </KeyboardAvoidingView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    fontSize: 16,
  },
  textArea: {
    textAlignVertical: "top",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
    marginBottom: 8,
  },
  button: {
    flex: 1,
  },
});
