/**
 * Add to Collection Bottom Sheet
 * Delegates to AppSheet (single dynamic sheet component). When user hits collection limit,
 * shows limit-reached sheet via same AppSheet.
 */

import React, { useState } from "react";
import { AppSheet } from "../../../components/AppSheet/AppSheet";
import { useSubscriptionNavigation } from "../../../hooks/useSubscriptionNavigation";

export interface AddToCollectionBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  mushroomId: string;
  mushroomName?: string;
  /** Called when user taps Done with selected collection id. Sheet is NOT closed automatically. */
  onConfirm: (collectionId: string) => void | Promise<void>;
  /** When provided, "Add New" opens this callback (e.g. show Create Collection sheet). Do not navigate away. */
  onRequestCreateNew?: () => void;
  /** When this value changes, the sheet refetches the collection list (e.g. after creating a new collection). */
  refreshTrigger?: unknown;
  /** When set, this collection is pre-selected (e.g. after creating a new collection so user can tap Done to add). */
  initialSelectedCollectionId?: string;
}

export const AddToCollectionBottomSheet: React.FC<
  AddToCollectionBottomSheetProps
> = ({
  visible,
  onClose,
  mushroomId,
  onConfirm,
  onRequestCreateNew,
  refreshTrigger,
  initialSelectedCollectionId,
}) => {
  const [showUpgradeSheet, setShowUpgradeSheet] = useState(false);
  const { navigateToSubscriptionMain } = useSubscriptionNavigation();

  return (
    <>
      <AppSheet
        visible={visible}
        onClose={onClose}
        type="addToCollection"
        payload={{
          mushroomId,
          onConfirm,
          onRequestCreateNew,
          refreshTrigger,
          initialSelectedCollectionId,
          onShowUpgrade: () => setShowUpgradeSheet(true),
        }}
      />
      <AppSheet
        visible={showUpgradeSheet}
        onClose={() => setShowUpgradeSheet(false)}
        type="limitReached"
        payload={{
          limitType: "collectionAlt",
          onUpgrade: () => {
            setShowUpgradeSheet(false);
            navigateToSubscriptionMain();
          },
        }}
      />
    </>
  );
};
