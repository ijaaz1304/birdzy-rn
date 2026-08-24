/**
 * Limit Reached Bottom Sheet – delegates to AppSheet (single dynamic sheet component).
 */

import React from "react";
import { AppSheet } from "../../components/AppSheet/AppSheet";
import type { LimitType } from "../../config/subscription.config";

export interface LimitReachedBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  limitType: LimitType;
  use70Discount?: boolean;
}

export const LimitReachedBottomSheet: React.FC<
  LimitReachedBottomSheetProps
> = ({ visible, onClose, onUpgrade, limitType, use70Discount = false }) => (
  <AppSheet
    visible={visible}
    onClose={onClose}
    type="limitReached"
    payload={{ limitType, use70Discount, onUpgrade }}
  />
);
