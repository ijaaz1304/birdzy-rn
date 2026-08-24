/**
 * Permission Modal
 * Generic permission request modal for camera, location, notifications, storage
 */

import React from "react";
import { View, StyleSheet } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useTheme, useIsDark } from "../../hooks/useTheme";
import { Text, Button } from "../../atoms";
import { Modal } from "./Modal";
import { ModalBackgroundSvg } from "./ModalBackgroundSvg";
import { Card } from "../Card";
import { useStrings } from "../../hooks/useStrings";
import { APP_COLORS } from "../../config/colors";
import { getDarkPopupBorderStyle } from "../../design-system/modalTokens";

export type PermissionType =
  | "camera"
  | "location"
  | "notifications"
  | "storage";

export interface PermissionModalProps {
  visible: boolean;
  onClose: () => void;
  onGrant: () => void;
  permissionType: PermissionType;
}

export const PermissionModal: React.FC<PermissionModalProps> = ({
  visible,
  onClose,
  onGrant,
  permissionType,
}) => {
  const theme = useTheme();
  const colors = theme.colors;
  const _spacing = theme.spacing;
  const _radius = theme.radius;
  const strings = useStrings();
  const isDark = useIsDark();

  const permissionConfig = strings.permissions[permissionType];

  const getIcon = () => {
    switch (permissionType) {
      case "camera":
        return "camera-alt";
      case "location":
        return "location-on";
      case "notifications":
        return "notifications";
      case "storage":
        return "folder";
      default:
        return "info";
    }
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      animationType="fade"
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
          <View style={styles.iconContainer}>
            <View
              style={[
                styles.iconCircle,
                {
                  backgroundColor: colors.primary + "20",
                },
              ]}
            >
              <MaterialIcons
                name={getIcon()}
                size={48}
                color={colors.primary}
              />
            </View>
          </View>

          <Text
            variant="headline"
            size="large"
            weight="bold"
            style={styles.title}
          >
            {permissionConfig.title}
          </Text>

          <Text
            variant="body"
            size="medium"
            color="textSecondary"
            style={styles.message}
          >
            {permissionConfig.message}
          </Text>

          <View style={styles.benefitsContainer}>
            {permissionConfig.benefits.map((benefit, index) => (
              <View key={index} style={styles.benefitItem}>
                <MaterialIcons
                  name="check-circle"
                  size={20}
                  color={colors.primary}
                />
                <Text
                  variant="body"
                  size="small"
                  color="textSecondary"
                  style={styles.benefitText}
                >
                  {benefit}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.actions}>
            <Button
              title={strings.common.buttons.later}
              variant="outline"
              size="large"
              onPress={onClose}
              style={[
                styles.laterButton,
                {
                  borderColor: isDark
                    ? APP_COLORS.cancelSecondaryBorderDark
                    : APP_COLORS.cancelSecondaryBorderLight,
                },
              ]}
            />
            <Button
              title={permissionConfig.buttonLabel}
              variant="primary"
              size="large"
              onPress={onGrant}
              style={styles.grantButton}
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
    maxWidth: 400,
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
    alignItems: "center",
    zIndex: 1,
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    marginBottom: 12,
    textAlign: "center",
  },
  message: {
    marginBottom: 20,
    textAlign: "center",
    lineHeight: 22,
  },
  benefitsContainer: {
    width: "100%",
    marginBottom: 24,
    gap: 12,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  benefitText: {
    flex: 1,
    lineHeight: 20,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  laterButton: {
    flex: 1,
  },
  grantButton: {
    flex: 1,
  },
});
