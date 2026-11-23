/**
 * DeleteAccountConfirmation – "Delete Account?" popup (X top-right, icon center).
 * Uses the Rockzy Settings account dialog.
 */

import React from "react";
import { CommonActions } from "@react-navigation/native";
import { useAuthStore } from "../features/auth/auth.store";
import { useTheme } from "../hooks/useTheme";
import { DeleteAccountTrashDark, Images } from "../assets";
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
  const isDark = theme.mode === "dark";

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
      icon={isDark ? undefined : Images.trashLight}
      // Figma 9603:38239: 64px teal trash illustration in dark mode.
      iconNode={
        isDark ? <DeleteAccountTrashDark width={64} height={64} /> : undefined
      }
      onClose={onClose}
      onConfirm={handleYes}
    />
  );
};

export default DeleteAccountConfirmation;
