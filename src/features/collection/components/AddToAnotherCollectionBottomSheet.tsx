/**
 * Add to Another Collection Bottom Sheet – delegates to AppSheet.
 * Used when a mushroom is already in a collection and should be added to another.
 */

import React from "react";
import { AppSheet } from "../../../components/AppSheet/AppSheet";

export interface AddToAnotherCollectionBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  /** Collection IDs to hide from the list (e.g. current collection). */
  excludeCollectionIds?: string[];
  /** Called when user taps Done with selected collection id. Sheet is NOT closed automatically. */
  onConfirm: (collectionId: string) => void | Promise<void>;
  /** When provided, "Add New" opens this callback (e.g. show Create Collection sheet). */
  onRequestCreateNew?: () => void;
  /** When this value changes, the sheet refetches the collection list. */
  refreshTrigger?: unknown;
  /** When set, this collection is pre-selected after creating a new collection. */
  initialSelectedCollectionId?: string;
}

export const AddToAnotherCollectionBottomSheet: React.FC<
  AddToAnotherCollectionBottomSheetProps
> = ({
  visible,
  onClose,
  excludeCollectionIds,
  onConfirm,
  onRequestCreateNew,
  refreshTrigger,
  initialSelectedCollectionId,
}) => (
  <AppSheet
    visible={visible}
    onClose={onClose}
    type="addToAnotherCollection"
    payload={{
      excludeCollectionIds,
      onConfirm,
      onRequestCreateNew,
      refreshTrigger,
      initialSelectedCollectionId,
    }}
  />
);
