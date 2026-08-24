import React, { useState } from "react";
import { View, TouchableOpacity } from "react-native";
import { ExpandableSectionProps } from "../../types/ui";

export const ExpandableSection = ({
  header,
  children,
  defaultExpanded = true,
}: ExpandableSectionProps) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <View>
      <TouchableOpacity
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        {header}
      </TouchableOpacity>
      {expanded && children}
    </View>
  );
};
