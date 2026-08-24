/**
 * Create Collection Bottom Sheet – delegates to AppSheet (single dynamic sheet component).
 */

import React, { useMemo } from "react";
import { AppSheet } from "../../../components/AppSheet/AppSheet";
import type { Collection } from "../../../services/api/features/core.api.types";

export interface CreateCollectionBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onCreated: (collection: Collection) => void;
  /** When create fails due to collection limit (e.g. free user 2nd collection), show Go Pro instead of error. */
  onLimitReached?: () => void;
}

export const CreateCollectionBottomSheet: React.FC<
  CreateCollectionBottomSheetProps
> = ({ visible, onClose, onCreated, onLimitReached }) => {
  const payload = useMemo(
    () => ({ onCreated, onLimitReached }),
    [onCreated, onLimitReached]
  );
  return (
    <AppSheet
      visible={visible}
      onClose={onClose}
      type="createCollection"
      payload={payload}
    />
  );
};
