/**
 * Community Rules Modal – delegates to AppSheet (single dynamic sheet component).
 */

import React from "react";
import { AppSheet } from "../../../components/AppSheet/AppSheet";
import type { FeedConfig } from "../config/feedConfig.types";

export interface CommunityRulesModalProps {
  visible: boolean;
  onAgree: () => void;
  onClose: () => void;
  config: FeedConfig;
}

export const CommunityRulesModal: React.FC<CommunityRulesModalProps> = ({
  visible,
  onAgree,
  onClose,
  config,
}) => (
  <AppSheet
    visible={visible}
    onClose={onClose}
    type="communityRules"
    payload={{ config, onAgree }}
  />
);
