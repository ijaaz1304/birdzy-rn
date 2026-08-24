/**
 * Congratulations bottom sheet — shown after 1st, 5th, and 10th identifications.
 * Uses AppSheet with congratulations_bg sheet background (illustration in bg).
 */

import React from "react";
import { AppSheet } from "../../components/AppSheet/AppSheet";

export interface CongratulationsModalProps {
  visible: boolean;
  onClose: () => void;
  count: number;
  onBackToHome: () => void;
}

export const CongratulationsModal: React.FC<CongratulationsModalProps> = ({
  visible,
  onClose,
  count,
  onBackToHome,
}) => (
  <AppSheet
    visible={visible}
    onClose={onClose}
    type="identificationMilestone"
    payload={{
      count,
      onBackToHome,
    }}
  />
);
