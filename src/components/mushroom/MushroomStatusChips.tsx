import { AppImage } from "@/components/AppImage";
import React from "react";
import { View, StyleSheet, ImageSourcePropType } from "react-native";
import { Text } from "../../atoms";
import { Images } from "../../assets";
import { EDIBILITY_LABELS } from "../../constants/mushroomOptions";
import { Radius } from "../../design";

export type MushroomStatusChipType =
  | "edible"
  | "toxic"
  | "psychoactive"
  | "inedible";

const CHIP_CONFIG: Record<
  MushroomStatusChipType,
  { label: string; icon: ImageSourcePropType; borderColor: string }
> = {
  edible: {
    label: EDIBILITY_LABELS.edible,
    icon: Images.mushroomEdible,
    borderColor: "#4CAF50",
  },
  toxic: {
    label: EDIBILITY_LABELS.toxic,
    icon: Images.mushroomToxic,
    borderColor: "#9E9E9E",
  },
  psychoactive: {
    label: "Psychoactive",
    icon: Images.mushroomPsychoactive,
    borderColor: "#E91E63",
  },
  inedible: {
    label: EDIBILITY_LABELS.inedible,
    icon: Images.mushroomInedible,
    borderColor: "#F44336",
  },
};

/** Returns which status chips apply to a mushroom match. */
export function getActiveMushroomStatusChips(
  edibility?: string | null,
  toxicitySeverity?: string | null,
  psychoactive?: string | null
): MushroomStatusChipType[] {
  const chips: MushroomStatusChipType[] = [];
  if (edibility === "edible") chips.push("edible");
  if (edibility === "inedible") chips.push("inedible");
  if (edibility === "toxic" || edibility === "deadly") {
    chips.push("toxic");
  } else if (toxicitySeverity && toxicitySeverity !== "none") {
    chips.push("toxic");
  }
  if (psychoactive === "yes") chips.push("psychoactive");
  return chips;
}

interface MushroomStatusChipsProps {
  edibility?: string | null;
  toxicitySeverity?: string | null;
  psychoactive?: string | null;
}

export const MushroomStatusChips: React.FC<MushroomStatusChipsProps> = ({
  edibility,
  toxicitySeverity,
  psychoactive,
}) => {
  const active = getActiveMushroomStatusChips(
    edibility,
    toxicitySeverity,
    psychoactive
  );
  if (!active.length) return null;

  return (
    <View style={styles.row}>
      {active.map((type) => {
        const config = CHIP_CONFIG[type];
        return (
          <View
            key={type}
            style={[styles.chip, { borderColor: config.borderColor }]}
          >
            <AppImage
              source={config.icon}
              style={styles.icon}
              resizeMode="contain"
            />
            <Text variant="body" size="small" weight="medium">
              {config.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 12,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  icon: {
    width: 20,
    height: 20,
  },
});
