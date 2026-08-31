/**
 * Poor Results Warning Modal
 * Shows warning with 4 error images in 2x2 grid
 */

import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { Text } from "../../atoms";
import { Modal } from "./Modal";
import { IDENTIFICATION_TIP_LIGHT_IMAGE_LIST } from "../../assets/identificationTipImages";
import { TipSampleImage } from "./TipSampleImage";

import { Radius } from "../../design";

import { spacing } from "../../design-system/spacing";
import { getPopupChromeStyle } from "../../design-system/modalTokens";

export interface PoorResultsWarningModalProps {
  visible: boolean;
  onClose: () => void;
  onUnderstood: () => void;
}

export const PoorResultsWarningModal: React.FC<
  PoorResultsWarningModalProps
> = ({ visible, onClose, onUnderstood }) => {
  const theme = useTheme();
  const colors = theme.colors;
  const _spacing = theme.spacing;
  const radius = theme.radius;

  const errorImages = IDENTIFICATION_TIP_LIGHT_IMAGE_LIST;

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      animationType="slide"
      contentStyle={styles.modalContent}
    >
      <View
        style={[
          styles.container,
          getPopupChromeStyle(theme),
        ]}
      >
        <Text
          variant="headline"
          size="medium"
          weight="bold"
          style={styles.title}
        >
          The following will lead to poor results
        </Text>

        {/* 2x2 Grid of Error Images */}
        <View style={styles.imageGrid}>
          {errorImages.map((image, index) => (
            <View key={index} style={styles.imageContainer}>
              <TipSampleImage
                source={image}
                borderRadius={Radius.sm}
                aspectRatio={1}
              />
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            {
              backgroundColor: colors.primaryCTA,
              borderRadius: radius.xl,
              minHeight: 50,
            },
          ]}
          onPress={onUnderstood}
          activeOpacity={0.8}
        >
          <Text
            variant="body"
            size="medium"
            weight="semibold"
            style={{ color: colors.onPrimary }}
          >
            I understood
          </Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContent: {
    padding: 0,
  },
  container: {
    padding: 24,
    alignItems: "center",
  },
  title: {
    marginBottom: 24,
    textAlign: "center",
  },
  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: "100%",
    marginBottom: 24,
    gap: 12,
  },
  imageContainer: {
    width: "47%",
    aspectRatio: 1,
    borderRadius: Radius.sm,
    overflow: "hidden",
  },
  button: {
    width: "100%",
    paddingVertical: spacing[4],
    alignItems: "center",
    justifyContent: "center",
  },
});
