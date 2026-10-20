/**
 * Change / Create password bottom sheet (Figma 7894:21226).
 * Drag handle, trailing close, heading1 title, password fields, sticky Save.
 */

import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, Button } from "../../../atoms";
import { FONTS } from "../../../common/typography";
import { OVERLAY_COLORS } from "../../../constants/colorConstants";
import { SETTINGS_STRINGS } from "../../../config/strings/settings.strings";
import DragHandleSvg from "../../../assets/icons/settings/drag-handle.svg";
import { useSettingsColors } from "../settingsColors";
import { SettingsIcon } from "./SettingsIcon";
import { SettingsTextField } from "./SettingsFormFields";

const S = SETTINGS_STRINGS.passwordSheet;

/** At least 8 characters with an uppercase letter, a lowercase letter and a digit. */
const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export type PasswordSheetMode = "change" | "create";

export interface PasswordSheetProps {
  visible: boolean;
  mode: PasswordSheetMode;
  onClose: () => void;
  /** Resolve on success; throw an Error with a user-facing message to keep the sheet open. */
  onSubmit: (values: { newPassword: string }) => Promise<void>;
}

export const PasswordSheet: React.FC<PasswordSheetProps> = ({
  visible,
  mode,
  onClose,
  onSubmit,
}) => {
  const c = useSettingsColors();
  const insets = useSafeAreaInsets();
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const isChange = mode === "change";

  useEffect(() => {
    if (!visible) {
      setNext("");
      setConfirm("");
      setError(null);
      setSaving(false);
    }
  }, [visible]);

  const canSave = !saving && !!next && !!confirm;

  const handleSave = async () => {
    if (next !== confirm) {
      setError(S.mismatch);
      return;
    }
    if (!PASSWORD_RULE.test(next)) {
      setError(S.requirements);
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await onSubmit({
        newPassword: next,
      });
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : S.failed);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.root}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: OVERLAY_COLORS.MODAL_BACKDROP },
            ]}
          />
        </TouchableWithoutFeedback>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.avoider}
          pointerEvents="box-none"
        >
          <View style={[styles.sheet, { backgroundColor: c.card }]}>
            <View style={styles.handleArea}>
              <DragHandleSvg color={c.cardBorder} />
            </View>
            <View style={styles.closeRow}>
              <TouchableOpacity
                onPress={onClose}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <SettingsIcon name="cancel" color={c.text} />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.content}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={[styles.title, { color: c.text }]}>
                {isChange ? S.changeTitle : S.createTitle}
              </Text>
              <SettingsTextField
                label={S.newPassword}
                labelTone="primary"
                placeholder={S.newPasswordPlaceholder}
                value={next}
                onChangeText={setNext}
                secureTextEntry
                autoCapitalize="none"
                textContentType="newPassword"
              />
              <SettingsTextField
                label={S.confirmPassword}
                labelTone="primary"
                placeholder={S.confirmPasswordPlaceholder}
                value={confirm}
                onChangeText={setConfirm}
                secureTextEntry
                autoCapitalize="none"
                textContentType="newPassword"
              />
              {error ? (
                <Text style={[styles.error, { color: c.danger }]}>{error}</Text>
              ) : null}
            </ScrollView>
            <View
              style={[
                styles.footer,
                { paddingBottom: Math.max(insets.bottom, 18) },
              ]}
            >
              <Button
                title={S.save}
                variant="primary"
                size="large"
                fullWidth
                onPress={handleSave}
                disabled={!canSave}
                loading={saving}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  avoider: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    height: "80%",
    minHeight: 480,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: "hidden",
  },
  handleArea: {
    height: 24,
    alignItems: "center",
    paddingTop: 8,
  },
  closeRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 16,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    gap: 24,
    paddingBottom: 24,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 32,
    lineHeight: 38.4,
  },
  error: {
    marginTop: -12,
    fontSize: 14,
    fontFamily: FONTS.regular,
    lineHeight: 20,
  },
  footer: {
    paddingTop: 18,
    paddingHorizontal: 16,
  },
});
