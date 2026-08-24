/**
 * Notification Permission Popup
 * Uses AppSheet (same as Rate Us) for consistent look and background.
 */

import React from "react";
import { AppSheet } from "../../components/AppSheet/AppSheet";

export interface NotificationPermissionPopupProps {
  visible: boolean;
  onClose: () => void;
  onGranted?: () => void;
  userId?: string | null;
}

export const NotificationPermissionPopup = ({
  visible,
  onClose,
  onGranted,
  userId: _userId,
}: NotificationPermissionPopupProps) => (
  <AppSheet
    visible={visible}
    onClose={onClose}
    type="notificationPermission"
    payload={{ onGranted }}
  />
);
