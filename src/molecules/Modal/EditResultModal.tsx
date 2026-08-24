/**
 * Edit Result Modal
 * Allows users to edit AI identification results
 */

import React, { useState } from "react";
import { View, StyleSheet, ScrollView, TextInput } from "react-native";
import { useTheme, useIsDark } from "../../hooks/useTheme";
import { Text, Button } from "../../atoms";
import { Modal } from "./Modal";
import { ModalBackgroundSvg } from "./ModalBackgroundSvg";
import { Card } from "../Card";
import { useStrings } from "../../hooks/useStrings";
import { APP_COLORS } from "../../config/colors";
import { getDarkPopupBorderStyle } from "../../design-system/modalTokens";

export interface EditResultModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (editedData: {
    commonNames?: string[];
    scientificName?: string;
    description?: string;
  }) => void;
  initialData: {
    commonName: string;
    scientificName: string;
    description: string;
  };
}

export const EditResultModal: React.FC<EditResultModalProps> = ({
  visible,
  onClose,
  onSave,
  initialData,
}) => {
  const theme = useTheme();
  const colors = theme.colors;
  const spacing = theme.spacing;
  const radius = theme.radius;
  const strings = useStrings();
  const isDark = useIsDark();

  const [commonName, setCommonName] = useState(initialData.commonName);
  const [scientificName, setScientificName] = useState(
    initialData.scientificName
  );
  const [description, setDescription] = useState(initialData.description);

  const handleSave = () => {
    const trimmedCommon = commonName.trim();
    onSave({
      commonNames: trimmedCommon ? [trimmedCommon] : undefined,
      scientificName,
      description,
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      animationType="slide"
      contentStyle={styles.modalContent}
    >
      <View
        style={[
          styles.cardWrapper,
          { borderRadius: theme.radius["2xl"] },
          getDarkPopupBorderStyle(theme),
        ]}
      >
        <ModalBackgroundSvg
          variant="70"
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
            {strings.camera.editResult.title}
          </Text>

          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.inputContainer}>
              <Text
                variant="label"
                size="medium"
                weight="medium"
                style={styles.label}
              >
                {strings.camera.editResult.commonName}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surfaceVariant,
                    borderRadius: radius.md,
                    padding: spacing[3],
                    color: colors.textPrimary,
                    borderColor: colors.border,
                    borderWidth: 1,
                  },
                ]}
                value={commonName}
                onChangeText={setCommonName}
                placeholder={strings.camera.editResult.commonNamePlaceholder}
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text
                variant="label"
                size="medium"
                weight="medium"
                style={styles.label}
              >
                {strings.camera.editResult.scientificName}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surfaceVariant,
                    borderRadius: radius.md,
                    padding: spacing[3],
                    color: colors.textPrimary,
                    borderColor: colors.border,
                    borderWidth: 1,
                  },
                ]}
                value={scientificName}
                onChangeText={setScientificName}
                placeholder={
                  strings.camera.editResult.scientificNamePlaceholder
                }
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text
                variant="label"
                size="medium"
                weight="medium"
                style={styles.label}
              >
                {strings.camera.editResult.description}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  {
                    backgroundColor: colors.surfaceVariant,
                    borderRadius: radius.md,
                    padding: spacing[3],
                    color: colors.textPrimary,
                    borderColor: colors.border,
                    borderWidth: 1,
                    minHeight: 120,
                  },
                ]}
                value={description}
                onChangeText={setDescription}
                placeholder={strings.camera.editResult.descriptionPlaceholder}
                placeholderTextColor={colors.textTertiary}
                multiline
                textAlignVertical="top"
              />
            </View>
          </ScrollView>

          <View style={styles.actions}>
            <Button
              title={strings.common.buttons.cancel}
              variant="outline"
              size="large"
              onPress={onClose}
              style={[
                styles.cancelButton,
                {
                  borderColor: isDark
                    ? APP_COLORS.cancelSecondaryBorderDark
                    : APP_COLORS.cancelSecondaryBorderLight,
                },
              ]}
            />
            <Button
              title={strings.common.buttons.save}
              variant="primary"
              size="large"
              onPress={handleSave}
              style={styles.saveButton}
            />
          </View>
        </Card>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContent: {
    width: "90%",
    maxWidth: 500,
    maxHeight: "80%",
  },
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
    maxHeight: "100%",
    zIndex: 1,
  },
  title: {
    marginBottom: 24,
    textAlign: "center",
  },
  scrollView: {
    maxHeight: 400,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    marginBottom: 8,
  },
  input: {
    fontSize: 16,
  },
  textArea: {
    textAlignVertical: "top",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
});
