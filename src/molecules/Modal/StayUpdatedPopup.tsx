/**
 * Stay Updated Popup – delegates to AppModal (single dynamic popup/modal component).
 */

import React from "react";
import { AppModal } from "../../components/AppModal/AppModal";

export interface StayUpdatedPopupProps {
  visible: boolean;
  onClose: () => void;
  onEnableUpdates: () => void;
}

export const StayUpdatedPopup: React.FC<StayUpdatedPopupProps> = ({
  visible,
  onClose,
  onEnableUpdates,
}) => (
  <AppModal
    visible={visible}
    onClose={onClose}
    type="stayUpdated"
    payload={{ onEnableUpdates }}
  />
);
