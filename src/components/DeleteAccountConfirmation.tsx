/**
 * DeleteAccountConfirmation – "Delete Account?" popup (X top-right, icon center).
 * Uses AppPopup for consistent UI with other popups and bottom sheets.
 */

import React from "react";
import { CommonActions } from "@react-navigation/native";
import { useAuthStore } from "../features/auth/auth.store";
import { useTheme } from "../hooks/useTheme";
import { Images } from "../assets";
import { SETTINGS_STRINGS } from "../config/strings/settings.strings";
import { NavigationService } from "../utils/navigation";
import { AppPopup } from "../molecules/Modal/AppPopup";

export interface DeleteAccountConfirmationProps {
  visible: boolean;
  onClose: () => void;
}

export const DeleteAccountConfirmation: React.FC<
  DeleteAccountConfirmationProps
> = ({ visible, onClose }) => {
  const theme = useTheme();
  const { deleteProfile, isLoading } = useAuthStore();
  const strings = SETTINGS_STRINGS.deleteAccount;
  const trashIcon =
    theme.mode === "dark" ? Images.trashDark : Images.trashLight;

  const handleYes = async () => {
    try {
      await deleteProfile();
      onClose();
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
    } catch {
      onClose();
    }
  };

  return (
    <AppPopup
      visible={visible}
      onClose={onClose}
      title={strings.title}
      subtitle={strings.description}
      icon={trashIcon}
      primaryButtonText={strings.yes}
      onPrimaryPress={handleYes}
      primaryLoading={isLoading}
      secondaryButtonText={strings.no}
      onSecondaryPress={onClose}
    />
  );
};

export default DeleteAccountConfirmation;
