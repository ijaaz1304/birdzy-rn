/**
 * Camera Tips Modal
 * Mushroom identification photo quality examples (too dark / far / bright / blurry).
 *
 * Use overlay={true} on camera screen so tips render above native camera view
 * (RN Modal can sit behind camera on some devices).
 */

import React, { useMemo } from "react";
import { Dimensions, Image, ImageSourcePropType, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, View, useWindowDimensions } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { useStrings } from "../../hooks/useStrings";
import { Text, Button } from "../../atoms";
import { Modal } from "./Modal";
import { IDENTIFICATION_TIP_LIGHT_IMAGES } from "../../assets/identificationTipImages";
import { TipSampleImage } from "./TipSampleImage";
import { CloseIcon } from "@/components/shared/CloseIcon";
import { getPopupChromeStyle } from "../../design-system/modalTokens";
export interface CameraTipsModalProps {
  visible: boolean;
  onClose: () => void;
  onDontShowAgain?: () => void;
  /** When true, render as in-screen overlay instead of RN Modal. */
  overlay?: boolean;
}

type TipStatus = "tooDark" | "tooFar" | "tooBright" | "blurry";

type TipItem = {
  id: string;
  image: ImageSourcePropType;
  status: TipStatus;
};

export const CameraTipsModal: React.FC<CameraTipsModalProps> = ({
  visible,
  onClose,
  onDontShowAgain: _onDontShowAgain,
  overlay = false,
}) => {
  const theme = useTheme();
  const colors = theme.colors;
  const spacing = theme.spacing;
  const radius = theme.radius;
  const strings = useStrings();
  const { width: windowWidth } = useWindowDimensions();

  const tips: TipItem[] = [
    {
      id: "too-dark",
      image: IDENTIFICATION_TIP_LIGHT_IMAGES.tooDark,
      status: "tooDark",
    },
    {
      id: "too-far",
      image: IDENTIFICATION_TIP_LIGHT_IMAGES.tooFar,
      status: "tooFar",
    },
    {
      id: "too-bright",
      image: IDENTIFICATION_TIP_LIGHT_IMAGES.tooBright,
      status: "tooBright",
    },
    {
      id: "blurry",
      image: IDENTIFICATION_TIP_LIGHT_IMAGES.blurry,
      status: "blurry",
    },
  ];

  const statusLabels = strings.camera.tips.statuses;

  const gridLayout = useMemo(() => {
    const horizontalPadding = 48;
    const cardMaxWidth = Math.min(420, windowWidth - horizontalPadding);
    const contentPadding = (spacing[6] ?? 24) * 2;
    const gridWidth = cardMaxWidth - contentPadding;
    const gap = 12;
    const itemWidth = Math.floor((gridWidth - gap) / 2);
    const totalGridWidth = itemWidth * 2 + gap;
    return { itemWidth, gap, totalGridWidth };
  }, [windowWidth, spacing]);

  if (!visible) return null;

  const renderTip = (tip: TipItem, index: number) => {
    const isFirstColumn = index % 2 === 0;
    return (
      <View
        key={tip.id}
        style={[
          styles.tipBox,
          {
            width: gridLayout.itemWidth,
            maxWidth: gridLayout.itemWidth,
            marginRight: isFirstColumn ? gridLayout.gap : 0,
            marginBottom: gridLayout.gap,
          },
        ]}
      >
        <TipSampleImage
          source={tip.image}
          borderRadius={radius.lg}
          style={styles.tipImageCard}
        />

        <View
          style={[
            styles.statusChip,
            {
              backgroundColor:
                theme.mode === "dark"
                  ? colors.surfaceInvert
                  : colors.textInverse,
              borderRadius: radius.full,
              alignSelf: "center",
            },
          ]}
        >
          <Text
            variant="body"
            size="small"
            weight="semibold"
            style={{
              color:
                theme.mode === "dark"
                  ? colors.textInverse
                  : colors.surfaceInvert,
              textAlign: "center",
            }}
          >
            {statusLabels[tip.status]}
          </Text>
        </View>
      </View>
    );
  };

  const card = (
    <TouchableWithoutFeedback onPress={onClose}>
      <View style={[StyleSheet.absoluteFill, styles.backdrop]} />
    </TouchableWithoutFeedback>
  );

  const content = (
    <View
      style={[
        styles.card,
        getPopupChromeStyle(theme),
        { padding: spacing[6] },
      ]}
    >
      <TouchableOpacity
        onPress={onClose}
        style={styles.closeBtn}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        accessibilityRole="button"
        accessibilityLabel="Close"
      >
        <CloseIcon isDark={theme.mode === "dark"} style={styles.closeIcon} />
      </TouchableOpacity>

      <Image
        source={IDENTIFICATION_TIP_LIGHT_IMAGES.alertIcon}
        style={styles.warningIcon}
        resizeMode="contain"
        fadeDuration={0}
        accessibilityIgnoresInvertColors
      />

      <Text
        variant="headline"
        size="large"
        weight="bold"
        style={{ textAlign: "center", marginTop: spacing[2] }}
      >
        {strings.camera.tips.title}
      </Text>

      <View
        style={[
          styles.tipsGrid,
          { marginTop: spacing[6], width: gridLayout.totalGridWidth },
        ]}
      >
        {tips.map((tip, index) => renderTip(tip, index))}
      </View>

      <View style={{ marginTop: spacing[4] }}>
        <Button
          title={strings.camera.tips.understood}
          variant="primary"
          size="large"
          onPress={onClose}
          fullWidth
        />
      </View>
    </View>
  );

  if (overlay) {
    const { width } = Dimensions.get("window");
    const horizontalPadding = 24;
    const cardWidth = width - horizontalPadding * 2;
    return (
      <View
        style={[
          StyleSheet.absoluteFill,
          styles.overlayRoot,
          { backgroundColor: colors.overlay, zIndex: 99999, elevation: 99999 },
        ]}
      >
        {card}
        <View
          style={[styles.overlayContent, { width: cardWidth, maxWidth: 420 }]}
        >
          {content}
        </View>
      </View>
    );
  }

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      animationType="slide"
      contentStyle={StyleSheet.flatten([
        styles.modalContent,
        { alignSelf: "center" as const },
      ])}
    >
      {content}
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContent: {
    width: "90%",
    maxWidth: 420,
  },
  overlayRoot: {
    justifyContent: "center",
    alignItems: "center",
  },
  overlayContent: {
    marginHorizontal: 24,
    alignSelf: "center",
  },
  backdrop: {
    backgroundColor: "transparent",
  },
  card: {
    width: "100%",
    maxWidth: 420,
  },
  closeBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 3,
  },
  closeIcon: {
    width: 24,
    height: 24,
  },
  warningIcon: {
    width: 64,
    height: 64,
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 4,
    backgroundColor: "transparent",
  },
  tipsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignSelf: "center",
  },
  tipBox: {
    minHeight: 150,
    alignItems: "stretch",
  },
  tipImageCard: {
    width: "100%",
  },
  statusChip: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});
