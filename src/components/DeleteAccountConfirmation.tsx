/**
 * DeleteAccountConfirmation – "Delete Account?" popup (X top-right, icon center).
 * Uses the Rockzy Settings account dialog.
 */

import React from "react";
import { CommonActions } from "@react-navigation/native";
import { useAuthStore } from "../features/auth/auth.store";
import { useTheme } from "../hooks/useTheme";
import { Images } from "../assets";
import { NavigationService } from "../utils/navigation";
import { SettingsAccountDialog } from "../features/settings/components/SettingsAccountDialog";

export interface DeleteAccountConfirmationProps {
  visible: boolean;
  onClose: () => void;
}

export const DeleteAccountConfirmation: React.FC<
  DeleteAccountConfirmationProps
> = ({ visible, onClose }) => {
  const theme = useTheme();
  const { deleteProfile } = useAuthStore();
  const trashIcon =
    theme.mode === "dark" ? Images.trashDark : Images.trashLight;

  const handleYes = async () => {
    await deleteProfile();
    const navRef = NavigationService.getNavigationRef();
    if (navRef?.isReady()) {
      navRef.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [
            {
              name: "AuthStack",
              state: { routes: [{ name: "SignUp" }], index: 0 },
            },
          ],
        })
      );
    }
  };

  return (
    <SettingsAccountDialog
      visible={visible}
      kind="delete"
      icon={trashIcon}
      onClose={onClose}
      onConfirm={handleYes}
    />
  );
};

export default DeleteAccountConfirmation;
