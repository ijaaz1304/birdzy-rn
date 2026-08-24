/**
 * Could Not Identify Modal – delegates to AppModal (single dynamic popup/modal component).
 */

import React from "react";
import { AppModal } from "../../components/AppModal/AppModal";

export interface CouldNotIdentifyModalButton {
  label: string;
  onPress: () => void;
  variant?: "primary" | "outline" | "ghost";
}

export interface CouldNotIdentifyModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  buttons: CouldNotIdentifyModalButton[];
}

export const CouldNotIdentifyModal: React.FC<CouldNotIdentifyModalProps> = ({
  visible,
  onClose,
  title,
  subtitle,
  buttons,
}) => (
  <AppModal
    visible={visible}
    onClose={onClose}
    type="couldNotIdentify"
    payload={{ title, subtitle, buttons }}
  />
);
