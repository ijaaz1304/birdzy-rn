/**
 * ExploreEmptyState
 *
 * Shown when a searched location has zero matching birds nearby.
 * Uses the Explore illustration from Figma node 8717:57690 at its native size.
 */

import React from "react";
import { EmptyState as BaseEmptyState } from "../../../molecules";
import { ExploreNoResultsIcon } from "../assets";
import { EXPLORE_STRINGS } from "@/features/explore/content/explore.strings";

export const ExploreEmptyState: React.FC = () => (
  <BaseEmptyState
    icon={<ExploreNoResultsIcon />}
    title={EXPLORE_STRINGS.emptyState.title}
    subtitle={EXPLORE_STRINGS.emptyState.subtitle}
  />
);
