/**
 * Subscription Failed Popup – delegates to AppModal (single dynamic popup/modal component).
 */

import React from "react";
import { AppModal } from "../../components/AppModal/AppModal";
import type { IapPurchaseErrorState } from "../../features/subscription/hooks/useIapPurchase";

export interface SubscriptionFailedPopupProps {
  visible: boolean;
  onClose: () => void;
  onRetry: () => void;
  /** When set, shows summary, detail, and app account in the popup. */
  failed?: Extract<IapPurchaseErrorState, { type: "failed" }> | null;
}

export const SubscriptionFailedPopup: React.FC<
  SubscriptionFailedPopupProps
> = ({ visible, onClose, onRetry, failed }) => (
  <AppModal
    visible={visible}
    onClose={onClose}
    type="subscriptionFailed"
    payload={{
      onRetry,
      summary: failed?.summary,
      detail: failed?.detail,
      appAccountMasked: failed?.appAccountMasked,
      transientStoreKit: failed?.transientStoreKit,
    }}
  />
);
