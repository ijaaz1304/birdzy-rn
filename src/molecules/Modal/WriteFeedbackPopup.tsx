/**
 * Write Feedback Popup – delegates to AppModal (single dynamic popup/modal component).
 */

import React from "react";
import { AppModal } from "../../components/AppModal/AppModal";

export interface WriteFeedbackPopupProps {
  visible: boolean;
  onClose: () => void;
  onWriteFeedback: () => void;
}

export const WriteFeedbackPopup: React.FC<WriteFeedbackPopupProps> = ({
  visible,
  onClose,
  onWriteFeedback,
}) => (
  <AppModal
    visible={visible}
    onClose={onClose}
    type="writeFeedback"
    payload={{ onWriteFeedback }}
  />
);
