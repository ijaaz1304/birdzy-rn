/**
 * Version Update Modal (Stay Updated) – bottom sheet with shared BackgroundHeader.
 */

import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { APP_COLORS } from "../../config/colors";
import { MODAL_STRINGS } from "../../config/strings/modals.strings";
import { Text } from "../../atoms";
import { Button } from "../../atoms";
import { Icon } from "../../atoms";
import { BottomSheetWithHeader } from "./BottomSheetWithHeader";

import { Radius } from "../../design";
import { getPopupPrimaryCtaStyle } from "../../design-system/modalTokens";

export interface VersionUpdateModalProps {
  visible: boolean;
  onClose?: () => void;
  onUpdate: () => void;
  version: string;
  isRequired?: boolean;
  updateNotes?: string[];
  title?: string;
}

export const VersionUpdateModal: React.FC<VersionUpdateModalProps> = ({
  visible,
  onClose,
  onUpdate,
  version,
  isRequired = false,
  updateNotes = [],
  title,
}) => {
  const theme = useTheme();

  return (
    <BottomSheetWithHeader
      visible={visible}
      onClose={isRequired ? () => {} : onClose ?? (() => {})}
      useLittleBg
      debugName="VersionUpdateModal"
    >
      <View style={styles.iconContainer}>
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: theme.colors.primary + "20" },
          ]}
        >
          <Icon name="download" size={48} color={theme.colors.primary} />
        </View>
      </View>

      <View style={styles.header}>
        <Text
          variant="headline"
          size="large"
          weight="bold"
          style={styles.title}
        >
          {title || MODAL_STRINGS.versionUpdate.title}
        </Text>
        <Text
          variant="body"
          size="medium"
          color="textSecondary"
          style={styles.version}
        >
          {MODAL_STRINGS.versionUpdate.versionLabel} {version}
        </Text>
      </View>

      {isRequired && (
        <View
          style={[
            styles.requiredBadge,
            { backgroundColor: theme.colors.error + "20" },
          ]}
        >
          <Icon name="alert-circle" size={16} color={theme.colors.error} />
          <Text
            variant="label"
            size="small"
            color="error"
            weight="semibold"
            style={styles.requiredText}
          >
            {MODAL_STRINGS.versionUpdate.requiredUpdate}
          </Text>
        </View>
      )}

      {updateNotes.length > 0 && (
        <View style={styles.notesContainer}>
          <Text
            variant="title"
            size="small"
            weight="semibold"
            style={styles.notesTitle}
          >
            {MODAL_STRINGS.versionUpdate.whatsNew}
          </Text>
          <ScrollView style={styles.notesList} nestedScrollEnabled>
            {updateNotes.map((note, index) => (
              <View key={index} style={styles.noteItem}>
                <Icon
                  name="check-circle"
                  size={16}
                  color={theme.colors.success}
                  style={styles.noteIcon}
                />
                <Text
                  variant="body"
                  size="small"
                  color="textSecondary"
                  style={styles.noteText}
                >
                  {note}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.actions}>
        {!isRequired && onClose && (
          <Button
            title={MODAL_STRINGS.versionUpdate.later}
            variant="outline"
            size="large"
            onPress={onClose}
            style={[
              styles.cancelButton,
              {
                borderColor:
                  theme.mode === "dark"
                    ? APP_COLORS.cancelSecondaryBorderDark
                    : APP_COLORS.cancelSecondaryBorderLight,
              },
            ]}
          />
        )}
        <Button
          title={MODAL_STRINGS.versionUpdate.updateNow}
          variant="primary"
          size="large"
          onPress={onUpdate}
          fullWidth={isRequired}
          style={[styles.updateButton, getPopupPrimaryCtaStyle(theme)]}
        />
      </View>
    </BottomSheetWithHeader>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    marginBottom: 16,
    alignItems: "center",
  },
  title: {
    marginBottom: 4,
    textAlign: "center",
  },
  version: {
    textAlign: "center",
  },
  requiredBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
    borderRadius: Radius.sm,
    marginBottom: 16,
    gap: 6,
  },
  requiredText: {
    marginLeft: 4,
  },
  notesContainer: {
    marginBottom: 24,
  },
  notesTitle: {
    marginBottom: 12,
  },
  notesList: {
    maxHeight: 150,
  },
  noteItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  noteIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  noteText: {
    flex: 1,
    lineHeight: 20,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
  },
  updateButton: {
    flex: 1,
  },
});
