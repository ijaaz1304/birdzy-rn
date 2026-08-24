/**
 * @deprecated Use LocationPermissionPopup for centered home-screen prompts.
 */

import React from "react";
import { LocationPermissionPopup } from "./LocationPermissionPopup";

export interface EnableLocationBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onRequestEnable?: () => void;
  onSuccess?: () => void;
  onCustomLocation?: () => void;
}

export const EnableLocationBottomSheet: React.FC<
  EnableLocationBottomSheetProps
> = ({ visible, onClose, onRequestEnable, onSuccess, onCustomLocation }) => (
  <LocationPermissionPopup
    visible={visible}
    onClose={onClose}
    onAllowLocation={() => {
      if (onRequestEnable) {
        onRequestEnable();
        return;
      }
      onSuccess?.();
    }}
    onCustomLocation={onCustomLocation ?? onClose}
  />
);
