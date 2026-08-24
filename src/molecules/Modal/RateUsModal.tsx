/**
 * Rate Us Modal – delegates to AppSheet (single dynamic sheet component).
 */

import React from "react";
import { AppSheet } from "../../components/AppSheet/AppSheet";

export interface RateUsModalProps {
  visible: boolean;
  onClose: () => void;
  onLowRating: (rating: number) => void;
  onHighRating: (rating: number) => void;
}

export const RateUsModal = ({
  visible,
  onClose,
  onLowRating,
  onHighRating,
}: RateUsModalProps) => (
  <AppSheet
    visible={visible}
    onClose={onClose}
    type="rateUs"
    payload={{ onLowRating, onHighRating }}
  />
);
