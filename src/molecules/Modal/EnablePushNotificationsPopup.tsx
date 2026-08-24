/**
 * Enable Push Notifications Popup – delegates to AppModal (single dynamic popup/modal component).
 */

import React from "react";
import { AppModal } from "../../components/AppModal/AppModal";

export interface EnablePushNotificationsPopupProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const EnablePushNotificationsPopup: React.FC<
  EnablePushNotificationsPopupProps
> = ({ visible, onClose, onSuccess }) => (
  <AppModal
    visible={visible}
    onClose={onClose}
    type="enablePushNotifications"
    payload={{ onSuccess }}
  />
);
