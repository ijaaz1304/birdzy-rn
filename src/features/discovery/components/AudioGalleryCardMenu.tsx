/**
 * Rename / Delete dropdown for an Unknown recording — Figma 9380:111794.
 * Opens on long-press of a card; sits 4px under the card, right-aligned, 120 wide.
 * Rendered in a transparent Modal so it overlays the next list rows.
 */

import React from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { Text } from "../../../atoms";
import { SoundLibraryDeleteIcon, SoundLibraryEditIcon } from "../../../assets";
import { FONTS } from "../../../common/typography";
import { useTheme } from "../../../hooks/useTheme";

export type CardMenuAnchor = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type Props = {
  anchor: CardMenuAnchor | null;
  renameLabel: string;
  deleteLabel: string;
  onRename: () => void;
  onDelete: () => void;
  onClose: () => void;
};

const MENU_WIDTH = 120;
const MENU_GAP = 4;
/** 2 rows × 36 + 4 gap. */
const MENU_HEIGHT = 76;

/** Figma dark: Surface-Secondary #091421, Border-0 #333, Text & icon-Secondary #D1D1D1. */
const MENU_DARK = {
  surface: "#091421",
  border: "#333333",
  label: "#D1D1D1",
} as const;
const MENU_LIGHT = {
  surface: "#F6F6F6",
  border: "#E7E7E7",
  label: "#5D5D5D",
} as const;
const DELETE_RED = "#EF4444";

export function AudioGalleryCardMenu({
  anchor,
  renameLabel,
  deleteLabel,
  onRename,
  onDelete,
  onClose,
}: Props) {
  const theme = useTheme();
  const isDark = theme.mode === "dark";
  const palette = isDark ? MENU_DARK : MENU_LIGHT;
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  if (!anchor) return null;

  const right = Math.max(8, screenWidth - (anchor.x + anchor.width));
  const below = anchor.y + anchor.height + MENU_GAP;
  // Flip above the card if it would run off the bottom of the screen.
  const top =
    below + MENU_HEIGHT > screenHeight - 16
      ? anchor.y - MENU_GAP - MENU_HEIGHT
      : below;

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <View
        style={[
          styles.menu,
          {
            top,
            right,
            backgroundColor: palette.surface,
            borderColor: palette.border,
            shadowColor: isDark ? "#FFFFFF" : "#000000",
            shadowOpacity: isDark ? 0.07 : 0.1,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.row}
          onPress={() => {
            onClose();
            onRename();
          }}
          accessibilityRole="button"
        >
          <SoundLibraryEditIcon width={20} height={20} color={palette.label} />
          <Text
            allowFontScaling={false}
            style={[styles.label, { color: palette.label }]}
          >
            {renameLabel}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.row}
          onPress={() => {
            onClose();
            onDelete();
          }}
          accessibilityRole="button"
        >
          <SoundLibraryDeleteIcon width={20} height={20} />
          <Text
            allowFontScaling={false}
            style={[styles.label, { color: DELETE_RED }]}
          >
            {deleteLabel}
          </Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  menu: {
    position: "absolute",
    width: MENU_WIDTH,
    borderWidth: 1,
    borderRadius: 8,
    gap: 4,
    overflow: "hidden",
    shadowOffset: { width: 4, height: 4 },
    shadowRadius: 8,
    elevation: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  label: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: 14,
    lineHeight: 20,
  },
});
