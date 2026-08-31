/**
 * Sound ID error popups — no bird detected, noise too high (product spec A2).
 */

import { AppImage } from "@/components/AppImage";
import React from "react";
import { Modal, StyleSheet, TouchableOpacity } from "react-native";
import type { ImageSourcePropType } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { Text, Button } from "../../../atoms";
import { Images } from "../../../assets";
import { CAMERA_STRINGS } from "../../../config/strings/camera.strings";
import { useTheme } from "../../../hooks/useTheme";
import { getPopupPrimaryCtaStyle } from "../../../design-system/modalTokens";
import { spacing } from "../../../design-system/spacing";
import { Radius } from "../../../design";

type BaseProps = {
  visible: boolean;
  onClose: () => void;
  onRetry?: () => void;
};

function SoundErrorModal({
  visible,
  onClose,
  onRetry,
  icon,
  iconImage,
  iconColor,
  title,
  message,
  retryLabel,
  dismissLabel,
}: BaseProps & {
  icon?: React.ComponentProps<typeof MaterialIcons>["name"];
  iconImage?: ImageSourcePropType;
  iconColor: string;
  title: string;
  message: string;
  retryLabel: string;
  dismissLabel: string;
}) {
  const theme = useTheme();
  const colors = theme.colors;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity
          activeOpacity={1}
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          {iconImage ? (
            <AppImage
              source={iconImage}
              style={styles.errorIconImage}
              resizeMode="contain"
            />
          ) : icon ? (
            <MaterialIcons name={icon} size={48} color={iconColor} />
          ) : null}
          <Text variant="title" size="medium" weight="bold" style={styles.title}>
            {title}
          </Text>
          <Text variant="body" size="medium" color="textSecondary" style={styles.message}>
            {message}
          </Text>
          {onRetry ? (
            <Button
              title={retryLabel}
              variant="primary"
              size="large"
              fullWidth
              onPress={onRetry}
              style={getPopupPrimaryCtaStyle(theme)}
            />
          ) : null}
          <Button
            title={dismissLabel}
            variant="secondary"
            size="large"
            fullWidth
            onPress={onClose}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

export const NoBirdDetectedModal: React.FC<BaseProps> = (props) => {
  const s = CAMERA_STRINGS.sound.errors.noBird;
  return (
    <SoundErrorModal
      {...props}
      icon="hearing-disabled"
      iconColor="#9E9E9E"
      title={s.title}
      message={s.message}
      retryLabel={s.retry}
      dismissLabel={s.dismiss}
    />
  );
};

export const NoiseTooHighModal: React.FC<BaseProps> = (props) => {
  const s = CAMERA_STRINGS.sound.errors.noise;
  return (
    <SoundErrorModal
      {...props}
      iconImage={Images.soundVolumeHigh}
      iconColor="#FF9800"
      title={s.title}
      message={s.message}
      retryLabel={s.retry}
      dismissLabel={s.dismiss}
    />
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: spacing[6],
  },
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: spacing[6],
    gap: spacing[3],
    alignItems: "center",
  },
  title: { textAlign: "center" },
  message: { textAlign: "center" },
  errorIconImage: {
    width: 48,
    height: 48,
  },
});
