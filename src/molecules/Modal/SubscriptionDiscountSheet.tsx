/**
 * Subscription discount bottom sheet — subs_pop_org background via AppSheet.
 * Shown while the global discount timer is active.
 */

import React from "react";
import { AppSheet } from "../../components/AppSheet/AppSheet";

export interface SubscriptionDiscountSheetProps {
  visible: boolean;
  onClose: () => void;
  onSubscribe: () => void;
  percentage?: number;
}

export const SubscriptionDiscountSheet: React.FC<
  SubscriptionDiscountSheetProps
> = ({ visible, onClose, onSubscribe, percentage = 50 }) => (
  <AppSheet
    visible={visible}
    onClose={onClose}
    type="subscriptionDiscount"
    payload={{ onSubscribe, percentage }}
  />
);
