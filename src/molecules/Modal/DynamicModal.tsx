/**
 * Dynamic Modal – full-screen celebration-style (same as Congratulations).
 * Uses shared BackgroundHeader. Title, subtitle, optional image, children, buttons.
 */

import { AppImage } from "@/components/AppImage";
import { CloseIcon } from "@/components/shared/CloseIcon";
import React, { ReactNode } from "react";
import { View, StyleSheet, Modal, ScrollView, TouchableOpacity, ImageSourcePropType } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, useIsDark } from "../../hooks/useTheme";
import { Text, Button } from "../../atoms";
import { BackgroundHeader } from "../BackgroundHeader";

const HEADER_HEIGHT = 200;

export interface DynamicModalButton {
  label: string;
  onPress: () => void;
  variant?: "primary" | "outline" | "ghost";
  loading?: boolean;
  disabled?: boolean;
}

export interface DynamicModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  image?: ImageSourcePropType;
  children?: ReactNode;
  buttons: DynamicModalButton[];
  imageStyle?: any;
}

export const DynamicModal: React.FC<DynamicModalProps> = ({
  visible,
  onClose,
  title,
  subtitle,
  image,
  children,
  buttons,
  imageStyle,
}) => {
  const theme = useTheme();
  const colors = theme.colors;
  const spacing = theme.spacing;
  const _radius = theme.radius;
  const insets = useSafeAreaInsets();
  const isDark = useIsDark();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={[styles.fullScreen, { backgroundColor: colors.surface }]}>
        <BackgroundHeader height={HEADER_HEIGHT} />
        <TouchableOpacity
          style={[
            styles.closeBtn,
            {
              top: insets.top + spacing[2],
              right: spacing[4],
            },
          ]}
          onPress={onClose}
          activeOpacity={0.8}
          hitSlop={12}
        >
          <CloseIcon isDark={isDark} />
        </TouchableOpacity>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + spacing[6] },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Text
            variant="headline"
            size="large"
            weight="bold"
            style={styles.title}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              variant="body"
              size="medium"
              color="textSecondary"
              style={styles.subtitle}
            >
              {subtitle}
            </Text>
          ) : null}

          {image ? (
            <View style={styles.visualWrap}>
              <AppImage
                source={image}
                style={[styles.centralImage, imageStyle]}
                resizeMode="contain"
              />
            </View>
          ) : null}

          {children ? (
            <View style={styles.customContent}>{children}</View>
          ) : null}

          <View style={styles.actions}>
            {buttons.map((button, index) => (
              <Button
                key={index}
                title={button.label}
                variant={button.variant || "primary"}
                size="large"
                onPress={button.onPress}
                loading={button.loading}
                disabled={button.disabled}
                style={styles.button}
              />
            ))}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
  },
  closeBtn: {
    position: "absolute",
    zIndex: 10,
    padding: 8,
    borderRadius: 20,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  title: {
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 24,
  },
  visualWrap: {
    alignItems: "center",
    marginVertical: 16,
  },
  centralImage: {
    width: 120,
    height: 120,
  },
  customContent: {
    width: "100%",
    marginBottom: 24,
    alignItems: "center",
  },
  actions: {
    gap: 12,
    marginTop: 8,
  },
  button: {
    width: "100%",
  },
});
