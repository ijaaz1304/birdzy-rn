/**
 * Add to Collection Modal
 * Allows users to select which collection to add a mineral to.
 * Design: Title "Select a collection", subtitle, checkbox list, Add New (plus icon), Done CTA.
 */

import React, { useState } from "react";
import { StyleSheet, FlatList, TouchableOpacity } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useTheme, useIsDark } from "../../hooks/useTheme";
import { Text, Button } from "../../atoms";
import { Modal } from "./Modal";
import { ModalCard } from "./ModalCard";
import { useStrings } from "../../hooks/useStrings";

import { APP_COLORS } from "../../config/colors";
import { getPopupPrimaryCtaStyle } from "../../design-system/modalTokens";

export interface Collection {
  id: string;
  name: string;
  mineralCount: number;
  isDefault?: boolean;
}

export interface AddToCollectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (collectionId: string) => void;
  onCreateNew: () => void;
  collections: Collection[];
  mushroomName?: string;
}

export const AddToCollectionModal: React.FC<AddToCollectionModalProps> = ({
  visible,
  onClose,
  onSelect,
  onCreateNew,
  collections,
}) => {
  const theme = useTheme();
  const colors = theme.colors;
  const spacing = theme.spacing;
  const radius = theme.radius;
  const strings = useStrings();
  const isDark = useIsDark();

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleDone = () => {
    if (selectedId) {
      onSelect(selectedId);
      setSelectedId(null);
      onClose();
    }
  };

  const addNewBg = isDark ? colors.primary : APP_COLORS.surfaceDarkMuted;
  const addNewTextColor = APP_COLORS.surfaceWhite;

  const sheetBg = isDark
    ? APP_COLORS.surfaceDark
    : APP_COLORS.modalTextOnPrimary;

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      animationType="slide"
      contentStyle={styles.modalContent}
    >
      <ModalCard
        onClose={onClose}
        showCloseButton={true}
        style={{ backgroundColor: sheetBg }}
      >
        <Text
          variant="headline"
          size="large"
          weight="bold"
          style={[styles.title, { color: colors.textPrimary }]}
        >
          {strings.collection.addToCollection.title}
        </Text>

        <Text
          variant="body"
          size="medium"
          color="textSecondary"
          style={styles.subtitle}
        >
          {strings.collection.addToCollection.subtitle}
        </Text>

        <FlatList
          data={collections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const selected = selectedId === item.id;
            return (
              <TouchableOpacity
                style={[
                  styles.collectionRow,
                  {
                    paddingVertical: spacing[3],
                    paddingHorizontal: spacing[4],
                    marginBottom: spacing[2],
                  },
                ]}
                onPress={() => setSelectedId(item.id)}
                activeOpacity={0.7}
              >
                <MaterialIcons
                  name={selected ? "check-box" : "check-box-outline-blank"}
                  size={24}
                  color={colors.primary}
                  style={styles.checkbox}
                />
                <Text
                  variant="body"
                  size="medium"
                  weight={selected ? "semibold" : "regular"}
                  style={{ color: colors.textPrimary }}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            );
          }}
          style={styles.list}
          contentContainerStyle={styles.listContent}
        />

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onCreateNew}
          style={[
            styles.addNewBtn,
            {
              backgroundColor: addNewBg,
              borderRadius: radius.lg,
              paddingVertical: spacing[3],
              paddingHorizontal: spacing[4],
              marginBottom: spacing[3],
            },
          ]}
        >
          <Text
            variant="body"
            size="large"
            weight="semibold"
            style={{ color: addNewTextColor }}
          >
            {strings.collection.addToCollection.createNew}
          </Text>
        </TouchableOpacity>

        <Button
          title={strings.common.buttons.done}
          variant="primary"
          size="large"
          onPress={handleDone}
          disabled={!selectedId}
          style={[styles.doneButton, getPopupPrimaryCtaStyle(theme), { opacity: selectedId ? 1 : 0.5 }]}
        />
      </ModalCard>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContent: {
    width: "90%",
    maxWidth: 400,
    maxHeight: "80%",
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 20,
  },
  list: {
    maxHeight: 300,
    marginBottom: 8,
  },
  listContent: {
    paddingBottom: 8,
  },
  collectionRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    marginRight: 12,
  },
  addNewBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  addNewIcon: {
    marginRight: 8,
  },
  doneButton: {
    width: "100%",
  },
});
