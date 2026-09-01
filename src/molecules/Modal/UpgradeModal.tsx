/**
 * Upgrade Modal – delegates to AppSheet (limitReached type).
 * Title, description, and icon from SUBSCRIPTION_CAROUSEL_ITEMS via limitType.
 */

import React from "react";
import { AppSheet } from "../../components/AppSheet/AppSheet";
import type { LimitType } from "../../config/subscription.config";

export interface UpgradeModalProps {
  visible: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  limitType?: LimitType;
  title?: string;
  subtitle?: string;
  /** Override sheet height (e.g. '60%' for Bird of the Day upgrade). */
  height?: number | string;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  visible,
  onClose,
  onUpgrade,
  limitType = "birdOfDay",
  height,
}) => (
  <AppSheet
    visible={visible}
    onClose={onClose}
    type="limitReached"
    payload={{ limitType, onUpgrade, ...(height != null && { height }) }}
  />
);
