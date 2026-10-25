import React from "react";
import { useAuthStore } from "../../features/auth/auth.store";
import { SettingsAccountDialog } from "../../features/settings/components/SettingsAccountDialog";
export interface LogoutConfirmationProps {
  visible: boolean;
  onClose: () => void;
}
export function LogoutConfirmation({
  visible,
  onClose,
}: LogoutConfirmationProps) {
  const { logout } = useAuthStore();
  return (
    <SettingsAccountDialog
      visible={visible}
      kind="logout"
      onClose={onClose}
      onConfirm={async () => {
        await logout();
      }}
    />
  );
}
export default LogoutConfirmation;
