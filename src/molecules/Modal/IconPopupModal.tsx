import { CloseIcon } from "@/components/shared/CloseIcon";
import React from "react";
import { ActivityIndicator, Modal, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, View, ViewStyle } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { Text } from "../../atoms";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { getPopupChromeStyle, getPopupSecondaryCtaStyle, getPopupSecondaryCtaTextColor } from "../../design-system/modalTokens";

export interface IconPopupPrimaryAction {
  label: string;
  onPress: () => void | Promise<void>;
  loading?: boolean;
  disabled?: boolean;
}

export interface IconPopupSecondaryAction {
  label: string;
  onPress: () => void | Promise<void>;
  disabled?: boolean;
}

export interface IconPopupModalProps {
  visible: boolean;
  onClose: () => void;
  /** Material icon name */
  iconName: string;
  title: string;
  message?: string;
  primaryAction: IconPopupPrimaryAction;
  /** Outline-style button */
  secondaryAction?: IconPopupSecondaryAction;
  /** Text-only action, like "Set up later" */
  tertiaryAction?: IconPopupSecondaryAction;
  /** When false, tapping backdrop does nothing */
  closeOnBackdropPress?: boolean;
  /** Optional card style override */
  cardStyle?: ViewStyle;
}

export const IconPopupModal: React.FC<
  React.PropsWithChildren<IconPopupModalProps>
> = ({
  visible,
  onClose,
  iconName,
  title,
  message,
  primaryAction,
  secondaryAction,
  tertiaryAction,
  closeOnBackdropPress = true,
  cardStyle,
  children,
}) => {
  const theme = useTheme();
  const colors = theme.colors;
  const spacing = theme.spacing;
  const radius = theme.radius;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
      presentationStyle="overFullScreen"
    >
      <TouchableWithoutFeedback
        onPress={closeOnBackdropPress ? onClose : undefined}
      >
        <View
          style={[
            styles.overlay,
            { backgroundColor: colors.overlay, zIndex: 9998, elevation: 9998 },
          ]}
        >
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.card,
                getPopupChromeStyle(theme),
                { padding: spacing[6] },
                cardStyle,
              ]}
            >
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <CloseIcon isDark={theme.mode === "dark"} size={18} />
              </TouchableOpacity>

              <View style={styles.iconRow}>
                <View
                  style={[
                    styles.iconCircle,
                    {
                      backgroundColor: colors.primary + "20",
                      borderRadius: radius.full,
                    },
                  ]}
                >
                  <MaterialIcons
                    name={iconName}
                    size={34}
                    color={colors.primary}
                  />
                </View>
              </View>

              <Text
                variant="headline"
                size="large"
                weight="bold"
                style={{ textAlign: "center", marginTop: spacing[3] }}
              >
                {title}
              </Text>

              {message ? (
                <Text
                  variant="body"
                  size="medium"
                  color="textSecondary"
                  style={{
                    textAlign: "center",
                    marginTop: spacing[2],
                    lineHeight: 22,
                  }}
                >
                  {message}
                </Text>
              ) : null}

              {children ? (
                <View style={{ width: "100%", marginTop: spacing[5] }}>
                  {children}
                </View>
              ) : null}

              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  { backgroundColor: colors.primary, borderRadius: radius.xl },
                  (primaryAction.disabled || primaryAction.loading) && {
                    opacity: 0.75,
                  },
                ]}
                onPress={primaryAction.onPress}
                disabled={primaryAction.disabled || primaryAction.loading}
                activeOpacity={0.85}
              >
                {primaryAction.loading ? (
                  <ActivityIndicator color={colors.onPrimary} />
                ) : (
                  <Text
                    variant="body"
                    size="medium"
                    weight="semibold"
                    style={{ color: colors.onPrimary }}
                  >
                    {primaryAction.label}
                  </Text>
                )}
              </TouchableOpacity>

              {secondaryAction ? (
                <TouchableOpacity
                  style={[
                    styles.secondaryButton,
                    getPopupSecondaryCtaStyle(theme),
                    secondaryAction.disabled && { opacity: 0.6 },
                  ]}
                  onPress={secondaryAction.onPress}
                  activeOpacity={0.85}
                  disabled={secondaryAction.disabled}
                >
                  <Text
                    variant="body"
                    size="medium"
                    weight="semibold"
                    style={{ color: getPopupSecondaryCtaTextColor(theme) }}
                  >
                    {secondaryAction.label}
                  </Text>
                </TouchableOpacity>
              ) : null}

              {tertiaryAction ? (
                <TouchableOpacity
                  onPress={tertiaryAction.onPress}
                  style={styles.tertiaryButton}
                  activeOpacity={0.7}
                  disabled={tertiaryAction.disabled}
                >
                  <Text variant="body" size="small" color="textSecondary">
                    {tertiaryAction.label}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    alignItems: "center",
    position: "relative",
  },
  closeButton: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 34,
    height: 34,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  iconRow: {
    alignItems: "center",
  },
  iconCircle: {
    width: 72,
    height: 72,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryButton: {
    width: "100%",
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginTop: 18,
    alignItems: "center",
  },
  secondaryButton: {
    width: "100%",
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginTop: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  tertiaryButton: {
    marginTop: 12,
  },
});
