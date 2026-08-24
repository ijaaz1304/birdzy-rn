/**
 * Report Bottom Sheet – delegates to AppSheet (single dynamic sheet component).
 */

import React from "react";
import { AppSheet } from "../../../components/AppSheet/AppSheet";
import { MODAL_STRINGS } from "../../../config/strings/modals.strings";

const POST_REPORT = MODAL_STRINGS.modals.reportPost;

export interface ReportBottomSheetProps {
  visible: boolean;
  title?: string;
  description?: string;
  onSubmit: (message: string) => void;
  onClose: () => void;
}

export const ReportBottomSheet: React.FC<ReportBottomSheetProps> = ({
  visible,
  title = POST_REPORT.title,
  description = POST_REPORT.description,
  onSubmit,
  onClose,
}) => (
  <AppSheet
    visible={visible}
    onClose={onClose}
    type="report"
    payload={{ title, description, onSubmit }}
  />
);
