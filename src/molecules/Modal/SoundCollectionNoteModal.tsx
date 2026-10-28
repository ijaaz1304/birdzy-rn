import React from "react";
import { Modal, StyleSheet, TouchableOpacity, View } from "react-native";
import { Text } from "../../atoms";
import { CloseIcon } from "../../components/shared/CloseIcon";
import { FONTS } from "../../common/typography";
import { COLLECTION_STRINGS } from "../../config/strings/collection.strings";
import { POPUP_BORDER_RADIUS } from "../../design-system/modalTokens";
import { useTheme } from "../../hooks/useTheme";

type Props = {
  visible: boolean;
  onClose: () => void;
};

const copy = COLLECTION_STRINGS.birdDetails.soundCollectionNote;

export function SoundCollectionNoteModal({ visible, onClose }: Props) {
  const theme = useTheme();
  const colors = theme.colors;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surfacePrimary,
              borderColor: colors.border0,
            },
          ]}
        >
          <TouchableOpacity
            onPress={onClose}
            style={[
              styles.close,
              {
                backgroundColor: colors.surfaceSecondary,
                borderColor: colors.border0,
              },
            ]}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <CloseIcon variant="plain" size={16} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {copy.title}
          </Text>
          <Text style={[styles.body, { color: colors.textSecondary }]}>
            {copy.message}
          </Text>
          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.85}
            style={[styles.okay, { backgroundColor: colors.primaryCTA }]}
          >
            <Text style={[styles.okayLabel, { color: colors.onPrimary }]}>
              {copy.okay}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  card: {
    width: "100%",
    maxWidth: 335,
    borderRadius: POPUP_BORDER_RADIUS,
    borderWidth: 1,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: "center",
  },
  close: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 20,
    lineHeight: 28,
    textAlign: "center",
  },
  body: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    letterSpacing: -0.16,
    marginTop: 8,
  },
  okay: {
    alignSelf: "stretch",
    height: 44,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 32,
  },
  okayLabel: {
    fontFamily: FONTS.medium,
    fontSize: 16,
    lineHeight: 24,
  },
});
