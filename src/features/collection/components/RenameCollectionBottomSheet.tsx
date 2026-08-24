/**
 * Rename Collection Bottom Sheet – delegates to AppSheet.
 */

import React from "react";
import { AppSheet } from "../../../components/AppSheet/AppSheet";

export interface RenameCollectionBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  collectionId: string;
  initialName: string;
  onRenamed: (name: string) => void;
}

export const RenameCollectionBottomSheet: React.FC<
  RenameCollectionBottomSheetProps
> = ({ visible, onClose, collectionId, initialName, onRenamed }) => (
  <AppSheet
    visible={visible}
    onClose={onClose}
    type="renameCollection"
    payload={{ collectionId, initialName, onRenamed }}
  />
);
