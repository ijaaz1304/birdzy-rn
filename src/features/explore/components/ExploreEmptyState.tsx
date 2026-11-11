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

type Props = {
  /** The map is zoomed out past the area that is searched. */
  wide?: boolean;
  /** Filters are applied, so the text suggests changing them. */
  filtered?: boolean;
};

export const ExploreEmptyState: React.FC<Props> = ({
  wide = false,
  filtered = false,
}) => {
  const strings = wide
    ? EXPLORE_STRINGS.wideEmptyState
    : filtered
    ? EXPLORE_STRINGS.filteredEmptyState
    : EXPLORE_STRINGS.emptyState;
  return (
    <BaseEmptyState
      icon={<ExploreNoResultsIcon />}
      appearance="body"
      title={strings.title}
      subtitle={strings.subtitle}
    />
  );
};
