/**
 * Empty State Component for Catalogue
 */

import React from "react";
import { ImageSourcePropType } from "react-native";
import { EmptyState as BaseEmptyState } from "../../../molecules";
import { Images } from "../../../assets";
import { CATALOGUE_STRINGS } from "../../../config/strings/catalogue.strings";

export interface EmptyStateProps {
  title?: string;
  subtitle?: string;
  emoji?: string;
  image?: ImageSourcePropType;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = CATALOGUE_STRINGS.emptyState.title,
  subtitle = CATALOGUE_STRINGS.emptyState.subtitle,
  image = Images.catalogueNoResults,
}) => {
  return (
    <BaseEmptyState
      image={image}
      title={title}
      subtitle={subtitle}
    />
  );
};
