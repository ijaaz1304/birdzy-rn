/**
 * Logout Confirmation – delegates to AppModal (single dynamic popup/modal component).
 */

import React from "react";
import { AppModal } from "../AppModal/AppModal";

export interface LogoutConfirmationProps {
  visible: boolean;
  onClose: () => void;
}

export const LogoutConfirmation: React.FC<LogoutConfirmationProps> = ({
  visible,
  onClose,
}) => (
  <AppModal
    visible={visible}
    onClose={onClose}
    type="logoutConfirm"
    payload={{}}
  />
);

export default LogoutConfirmation;
