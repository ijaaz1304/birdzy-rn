/**
 * Feedback Modal – delegates to AppSheet (single dynamic sheet component).
 */

import React from "react";
import { AppSheet } from "../../components/AppSheet/AppSheet";

export interface FeedbackModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    email: string;
    feedback: string;
    rating?: number;
  }) => void | Promise<void>;
  rating?: number;
}

export const FeedbackModal = ({
  visible,
  onClose,
  onSubmit,
  rating,
}: FeedbackModalProps) => (
  <AppSheet
    visible={visible}
    onClose={onClose}
    type="feedback"
    payload={{ onSubmit, rating }}
  />
);
