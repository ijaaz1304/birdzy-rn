/**
 * Rate Us Popup – delegates to AppModal (single dynamic popup/modal component).
 */

import React from "react";
import { AppModal } from "../../components/AppModal/AppModal";

export interface RateUsPopupProps {
  visible: boolean;
  onClose: () => void;
  storeUrl?: string;
}

export const RateUsPopup: React.FC<RateUsPopupProps> = ({
  visible,
  onClose,
  storeUrl,
}) => (
  <AppModal
    visible={visible}
    onClose={onClose}
    type="rateUsPopup"
    payload={{ storeUrl }}
  />
);
