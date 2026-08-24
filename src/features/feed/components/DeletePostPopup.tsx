/**
 * Delete Post Popup – delegates to AppModal (single dynamic popup/modal component).
 */

import React from "react";
import { AppModal } from "../../../components/AppModal/AppModal";

export interface DeletePostPopupProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeletePostPopup: React.FC<DeletePostPopupProps> = ({
  visible,
  onConfirm,
  onCancel,
}) => (
  <AppModal
    visible={visible}
    onClose={onCancel}
    type="deletePost"
    payload={{ onConfirm }}
  />
);
