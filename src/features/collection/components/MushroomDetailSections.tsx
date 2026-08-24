/**
 * Mushroom-specific detail sections for archetype / identify / collection detail screens.
 */

import { AppImage, CachedRemoteImage } from "@/components/AppImage";
import React from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Text } from "../../../atoms";
import { MushroomSafetyBadge } from "../../../components/mushroom/MushroomSafetyBadge";
import { MUSHROOM_SAFETY_DISCLAIMER } from "../../../constants/mushroomOptions";
import {
  formatDistributionHotspotsDisplay,
  formatFruitingSeasonDisplay,
  formatMushroomList,
  isMushroomRecord,
  normalizeMushroomDetail,
} from "../../../utils/mushroomApiMappers";
import { getDisplayName } from "../../../utils/mushroomDisplayUtils";
import { Images } from "../../../assets";
import { Radius } from "../../../design";

export type MushroomDetailSection =
  | "all"
  | "safety"
  | "morphology"
  | "habitat"
  | "similar";

interface MushroomDetailSectionsProps {
  data: Record<string, unknown>;
  isDark?: boolean;
  section?: MushroomDetailSection;
  onLookAlikePress?: (lookAlike: Record<string, unknown>) => void;
}

const PropRow: React.FC<{ label: string; value?: string | null }> = ({
  label,
  value,
}) => {
  if (!value?.trim()) return null;
  return (
    <View style={styles.propRow}>
      <Text variant="body" size="small" color="textSecondary">
        {label}
      </Text>
      <Text variant="body" size="medium" style={styles.propValue}>
        {value}
      </Text>
    </View>
  );
};

export const MushroomDetailSections: React.FC<MushroomDetailSectionsProps> = ({
  data,
  isDark = false,
  section = "all",
  onLookAlikePress,
}) => {
  if (!isMushroomRecord(data)) return null;

  const mushroom = normalizeMushroomDetail(data);
  const lookAlikes = mushroom.lookAlikes ?? [];
  const showSafety = section === "all" || section === "safety";
  const showMorphology = section === "all" || section === "morphology";
  const showHabitat = section === "all" || section === "habitat";
  const showSimilar = section === "all" || section === "similar";

  return (
    <View style={styles.container}>
      {showSafety && (
        <View style={[styles.safetyCard, isDark && styles.safetyCardDark]}>
          <MushroomSafetyBadge
            edibility={mushroom.edibility}
            toxicitySeverity={mushroom.toxicitySeverity}
            psychoactive={mushroom.psychoactive}
          />
          {mushroom.symptoms ? (
            <PropRow label="Symptoms if any" value={mushroom.symptoms} />
          ) : null}
          <Text
            variant="body"
            size="small"
            color="textTertiary"
            style={styles.disclaimer}
          >
            {MUSHROOM_SAFETY_DISCLAIMER}
          </Text>
        </View>
      )}

      {showMorphology && (
        <>
          {section === "all" ? (
            <Text
              variant="body"
              size="medium"
              weight="semibold"
              style={styles.sectionTitle}
            >
              Physical Traits
            </Text>
          ) : null}
          <PropRow label="Cap color" value={mushroom.capColor} />
          <PropRow label="Cap shape" value={mushroom.capShape} />
          <PropRow label="Cap size" value={mushroom.capDiameterRange} />
          <PropRow
            label="Cap surface"
            value={formatMushroomList(mushroom.capSurface)}
          />
          <PropRow label="Underside" value={mushroom.undersideType} />
          <PropRow label="Stem" value={mushroom.stemPresence} />
          <PropRow
            label="Stem surface"
            value={formatMushroomList(mushroom.stemSurface)}
          />
          <PropRow label="Stem height" value={mushroom.stemHeightRange} />
          <PropRow label="Ring" value={mushroom.ringPresent} />
          <PropRow label="Volva" value={mushroom.volvaPresent} />
        </>
      )}

      {showHabitat && (
        <>
          {section === "all" ? (
            <Text
              variant="body"
              size="medium"
              weight="semibold"
              style={styles.sectionTitle}
            >
              Habitat and Distribution
            </Text>
          ) : null}
          <PropRow
            label="Habitat Type"
            value={formatMushroomList(mushroom.habitatType)}
          />
          <PropRow label="Growth Pattern" value={mushroom.growthPattern} />
          <PropRow
            label="Geographic Distribution"
            value={formatMushroomList(
              mushroom.geographicDistribution?.length
                ? mushroom.geographicDistribution
                : mushroom.commonlyFoundIn
            )}
          />
          <PropRow
            label="Fruiting Season"
            value={formatFruitingSeasonDisplay(mushroom.fruitingSeason)}
          />
          <PropRow
            label="Geographic Distribution Hotspots"
            value={formatDistributionHotspotsDisplay(
              mushroom.distributionHotspots
            )}
          />
        </>
      )}

      {showSimilar && lookAlikes.length > 0 ? (
        <>
          {section === "all" ? (
            <Text
              variant="body"
              size="medium"
              weight="semibold"
              style={styles.sectionTitle}
            >
              Similar species
            </Text>
          ) : null}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {lookAlikes.map((item, index) => {
              const uri = item.imageUrls?.[0];
              return (
                <TouchableOpacity
                  key={item.speciesId ?? item.scientificName ?? index}
                  style={[
                    styles.lookAlikeCard,
                    isDark && styles.lookAlikeCardDark,
                  ]}
                  onPress={() =>
                    onLookAlikePress?.(item as unknown as Record<string, unknown>)
                  }
                  disabled={!onLookAlikePress}
                >
                  {uri ? (
                    <CachedRemoteImage
                      uri={uri}
                      style={styles.lookAlikeImage}
                      borderRadius={Radius.sm}
                      resizeMode="cover"
                    />
                  ) : (
                    <AppImage
                      source={Images.card_image_placeholder}
                      style={styles.lookAlikeImage}
                    />
                  )}
                  <Text
                    variant="body"
                    size="small"
                    weight="semibold"
                    numberOfLines={2}
                  >
                    {getDisplayName(item) || item.scientificName}
                  </Text>
                  {item.similarityScore != null ? (
                    <Text variant="body" size="small" color="textSecondary">
                      {item.similarityScore}% similar
                    </Text>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  safetyCard: {
    backgroundColor: "#FFF9F0",
    borderRadius: Radius.md,
    padding: 14,
    marginBottom: 16,
  },
  safetyCardDark: {
    backgroundColor: "#2A2418",
  },
  warningText: {
    marginTop: 8,
    color: "#B71C1C",
  },
  disclaimer: {
    marginTop: 10,
    lineHeight: 18,
  },
  sectionTitle: {
    marginTop: 12,
    marginBottom: 8,
  },
  propRow: {
    marginBottom: 10,
  },
  propValue: {
    marginTop: 2,
  },
  lookAlikeCard: {
    width: 140,
    marginRight: 12,
    padding: 8,
    borderRadius: Radius.sm,
    backgroundColor: "#FFFFFF",
  },
  lookAlikeCardDark: {
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "#333333",
  },
  lookAlikeImage: {
    width: "100%",
    height: 90,
    borderRadius: Radius.sm,
    marginBottom: 6,
  },
});
