/**
 * PostActionSheet Component
 * Action sheet for post options - Edit/Delete for own posts, Hide/Report for others.
 * Figma: text labels only (no leading icons) by default.
 */

import React from "react";
import { View, TouchableOpacity, StyleSheet, Modal, Pressable } from "react-native";
import { useTheme } from "../../../hooks/useTheme";
import { OVERLAY_COLORS, UI_COLORS } from "../../../constants/colorConstants";
import { Text } from "../../../atoms";
import { Icon } from "../../../atoms";
import { Radius } from "../../../design";

import { spacing } from "../../../design-system/spacing";

import {
  DetailsMoreEditLight,
  DetailsMoreEditDark,
  DetailsMoreRemoveLight,
  DetailsMoreRemoveDark,
  DetailsMoreReportLight,
  DetailsMoreReportDark,
} from "../../../assets";

export interface PostActionSheetProps {
  visible: boolean;
  isMyPost: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onHide?: () => void;
  onReport?: () => void;
  onClose: () => void;
  /** When set, sheet is positioned just below the trigger button (top = anchor from screen top) */
  anchorTop?: number;
  /** Figma post details: labels only, no leading icons */
  showOptionIcons?: boolean;
}

export const PostActionSheet: React.FC<PostActionSheetProps> = ({
  visible,
  isMyPost,
  onEdit,
  onDelete,
  onHide,
  onReport,
  onClose,
  anchorTop,
  showOptionIcons = false,
}) => {
  const theme = useTheme();
  const isDark = theme.mode === "dark";
  const EditIcon = isDark ? DetailsMoreEditDark : DetailsMoreEditLight;
  const RemoveIcon = isDark ? DetailsMoreRemoveDark : DetailsMoreRemoveLight;
  const ReportIcon = isDark ? DetailsMoreReportDark : DetailsMoreReportLight;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable
        style={[
          styles.backdrop,
          typeof anchorTop === "number" && { paddingTop: 0 },
        ]}
        onPress={onClose}
      >
        <View
          style={[
            styles.sheetWrap,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              ...(typeof anchorTop === "number" && { marginTop: anchorTop }),
            },
          ]}
          onStartShouldSetResponder={() => true}
        >
          {isMyPost ? (
            <>
              {/* Edit Option */}
              <TouchableOpacity
                style={styles.option}
                onPress={() => {
                  onEdit?.();
                  onClose();
                }}
                activeOpacity={0.7}
              >
                {showOptionIcons ? (
                  <EditIcon width={20} height={20} />
                ) : null}
                <Text variant="body" size="medium" color="text">
                  Edit
                </Text>
              </TouchableOpacity>

              {/* Separator */}
              <View
                style={[
                  styles.separator,
                  { backgroundColor: theme.colors.border },
                ]}
              />

              {/* Delete Option – only onDelete so parent keeps optionsPost for confirm modal; parent closes sheet in onDelete */}
              <TouchableOpacity
                style={styles.option}
                onPress={() => {
                  onDelete?.();
                }}
                activeOpacity={0.7}
              >
                {showOptionIcons ? (
                  <RemoveIcon width={20} height={20} />
                ) : null}
                <Text variant="body" size="medium" color="error">
                  Delete
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* Hide Post Option */}
              <TouchableOpacity
                style={styles.option}
                onPress={() => {
                  onHide?.();
                  onClose();
                }}
                activeOpacity={0.7}
              >
                {showOptionIcons ? (
                  <Icon name="eye-off" size={20} color={theme.colors.text} />
                ) : null}
                <Text variant="body" size="medium" color="text">
                  Hide post
                </Text>
              </TouchableOpacity>

              {/* Separator */}
              <View
                style={[
                  styles.separator,
                  { backgroundColor: theme.colors.border },
                ]}
              />

              {/* Report Option */}
              <TouchableOpacity
                style={styles.option}
                onPress={() => {
                  onReport?.();
                  onClose();
                }}
                activeOpacity={0.7}
              >
                {showOptionIcons ? (
                  <ReportIcon width={20} height={20} />
                ) : null}
                <Text variant="body" size="medium" color="text">
                  Report
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: OVERLAY_COLORS.BOTTOM_SHEET_BACKDROP,
    alignItems: "flex-end",
    paddingRight: 16,
    paddingTop: 56,
  },
  sheetWrap: {
    minWidth: 160,
    borderRadius: Radius.md,
    borderWidth: 1,
    shadowColor: UI_COLORS.SHADOW,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    overflow: "hidden",
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: spacing[4],
    paddingHorizontal: 20,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
  },
});
