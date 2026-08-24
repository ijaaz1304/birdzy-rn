/**
 * Bird-specific detail UI — sounds player, range map, and trait rows.
 */

import { AppImage } from "@/components/AppImage";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { Images } from "../../../assets";
import { useNavigation } from "@react-navigation/native";
import { InfoRow, Text } from "../../../atoms";
import { StaticMap } from "../../../molecules/StaticMap/StaticMap";
import { navigateToSoundIdentify } from "../../../utils/navigation";
import { COLLECTION_STRINGS } from "../../../config/strings/collection.strings";
import { soundRecordingService } from "../../../services/audio/soundRecording.service";
import type { BirdRangeDetails } from "../../../services/api/features/bird.api.types";
import type { MushroomDetail } from "../../../types/mushrooms.types";
import { formatMushroomList } from "../../../utils/mushroomApiMappers";
import { FONTS } from "../../../common/typography";
import { spacing } from "../../../design-system/spacing";
import { Radius } from "../../../design";
import { useSemanticColors } from "../../../hooks/useSemanticColors";

const MONTH_LABELS = [
  "J",
  "F",
  "M",
  "A",
  "M",
  "J",
  "J",
  "A",
  "S",
  "O",
  "N",
  "D",
] as const;

const MONTH_NAME_TO_INDEX: Record<string, number> = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
};

const RANGE_COLORS = {
  yearRound: "#4CAF50",
  breeding: "#FF9800",
  migration: "#2196F3",
  nonBreeding: "#9E9E9E",
} as const;

type RangeKey = keyof typeof RANGE_COLORS;

function parseMonthIndices(value?: string): number[] | null {
  if (!value?.trim()) return null;
  const raw = value.trim().toLowerCase();

  const rangeMatch = raw.match(
    /([a-z]+|\d{1,2})\s*[-–—]\s*([a-z]+|\d{1,2})/i
  );
  if (rangeMatch) {
    const start = monthTokenToIndex(rangeMatch[1]);
    const end = monthTokenToIndex(rangeMatch[2]);
    if (start != null && end != null) {
      const months: number[] = [];
      if (start <= end) {
        for (let i = start; i <= end; i++) months.push(i);
      } else {
        for (let i = start; i < 12; i++) months.push(i);
        for (let i = 0; i <= end; i++) months.push(i);
      }
      return months;
    }
  }

  const parts = raw.split(/[,;/|]+/).map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return null;

  const indices = parts
    .map(monthTokenToIndex)
    .filter((i): i is number => i != null);
  return indices.length ? [...new Set(indices)] : null;
}

function monthTokenToIndex(token: string): number | null {
  const t = token.trim().toLowerCase();
  if (MONTH_NAME_TO_INDEX[t] != null) return MONTH_NAME_TO_INDEX[t];
  const num = parseInt(t, 10);
  if (Number.isFinite(num) && num >= 1 && num <= 12) return num - 1;
  return null;
}

function RangeMonthBar({
  label,
  color,
  months,
  textPrimary,
  textSecondary,
}: {
  label: string;
  color: string;
  months: number[];
  textPrimary: string;
  textSecondary: string;
}) {
  const active = new Set(months);
  return (
    <View style={styles.rangeRow}>
      <Text
        style={[styles.rangeLabel, { color: textSecondary }]}
        numberOfLines={1}
      >
        {label}
      </Text>
      <View style={styles.monthBar}>
        {MONTH_LABELS.map((m, index) => (
          <View
            key={`${label}-${m}-${index}`}
            style={[
              styles.monthCell,
              { backgroundColor: active.has(index) ? color : "transparent" },
            ]}
          >
            <Text
              style={[
                styles.monthCellLabel,
                { color: active.has(index) ? "#FFFFFF" : textSecondary },
              ]}
            >
              {m}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function RangeTextRow({
  label,
  value,
  textPrimary,
  textSecondary,
}: {
  label: string;
  value: string;
  textPrimary: string;
  textSecondary: string;
}) {
  return (
    <InfoRow
      label={label}
      value={value}
      labelColor={textSecondary}
      valueColor={textPrimary}
      rowPaddingVertical={2}
    />
  );
}

export function BirdRangeMapSection({
  rangeDetails,
  textPrimary,
  textSecondary,
}: {
  rangeDetails?: BirdRangeDetails;
  textPrimary: string;
  textSecondary: string;
}) {
  const strings = COLLECTION_STRINGS.birdDetails.range;

  const rows = useMemo(() => {
    if (!rangeDetails) return [];
    return (
      [
        { key: "yearRound" as RangeKey, label: strings.yearRound, value: rangeDetails.yearRound },
        { key: "breeding" as RangeKey, label: strings.breeding, value: rangeDetails.breeding },
        { key: "migration" as RangeKey, label: strings.migration, value: rangeDetails.migration },
        {
          key: "nonBreeding" as RangeKey,
          label: strings.nonBreeding,
          value: rangeDetails.nonBreeding,
        },
      ] as const
    ).filter((row) => row.value?.trim());
  }, [rangeDetails, strings]);

  if (rows.length === 0) return null;

  const barRows = rows
    .map((row) => ({
      ...row,
      months: parseMonthIndices(row.value),
    }))
    .filter((row) => row.months && row.months.length > 0);

  const textOnlyRows = rows.filter(
    (row) => !parseMonthIndices(row.value)?.length
  );

  return (
    <View style={styles.sectionBlock}>
      {barRows.length > 0 ? (
        <View style={styles.rangeBars}>
          {barRows.map((row) => (
            <RangeMonthBar
              key={row.key}
              label={row.label}
              color={RANGE_COLORS[row.key]}
              months={row.months!}
              textPrimary={textPrimary}
              textSecondary={textSecondary}
            />
          ))}
          <View style={styles.legendRow}>
            {barRows.map((row) => (
              <View key={`legend-${row.key}`} style={styles.legendItem}>
                <View
                  style={[
                    styles.legendSwatch,
                    { backgroundColor: RANGE_COLORS[row.key] },
                  ]}
                />
                <Text style={[styles.legendText, { color: textSecondary }]}>
                  {row.label}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}
      {textOnlyRows.length > 0 ? (
        <View style={styles.rowsBlock}>
          {textOnlyRows.map((row) => (
            <RangeTextRow
              key={row.key}
              label={row.label}
              value={row.value!}
              textPrimary={textPrimary}
              textSecondary={textSecondary}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

export function BirdSoundsSection({
  soundUrls,
  textPrimary,
  textSecondary,
  surfaceSecondary,
}: {
  soundUrls: string[];
  textPrimary: string;
  textSecondary: string;
  surfaceSecondary: string;
}) {
  const strings = COLLECTION_STRINGS.birdDetails.sounds;
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);

  useEffect(() => {
    return () => {
      void soundRecordingService.stopPlayback();
    };
  }, []);

  const togglePlay = useCallback(
    async (index: number, url: string) => {
      if (playingIndex === index) {
        await soundRecordingService.stopPlayback();
        setPlayingIndex(null);
        return;
      }
      await soundRecordingService.stopPlayback();
      await soundRecordingService.play(url);
      setPlayingIndex(index);
    },
    [playingIndex]
  );

  if (soundUrls.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.soundsScroll}
    >
      {soundUrls.map((url, index) => {
        const isPlaying = playingIndex === index;
        return (
          <TouchableOpacity
            key={`${url}-${index}`}
            style={[
              styles.soundCard,
              { backgroundColor: surfaceSecondary },
            ]}
            onPress={() => void togglePlay(index, url)}
            activeOpacity={0.85}
          >
            <View
              style={[
                styles.soundIconWrap,
                isPlaying && styles.soundIconWrapActive,
              ]}
            >
              <AppImage
                source={isPlaying ? Images.soundPause : Images.soundPlay}
                style={styles.soundPlayIcon}
                resizeMode="contain"
              />
            </View>
            <Text style={[styles.soundLabel, { color: textPrimary }]}>
              {`${strings.callPrefix} ${index + 1}`}
            </Text>
            <Text
              style={[styles.soundHint, { color: textSecondary }]}
              numberOfLines={1}
            >
              {isPlaying ? strings.playing : strings.tapToPlay}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

export function BirdPhysicalTraitsRows({
  bird,
  textPrimary,
  textSecondary,
}: {
  bird: MushroomDetail;
  textPrimary: string;
  textSecondary: string;
}) {
  const s = COLLECTION_STRINGS.birdDetails.traits;
  const tips = bird.birdWatchingTips;

  const rows = [
    { label: s.length, value: bird.lengthRange },
    { label: s.wingspan, value: bird.wingspanRange },
    { label: s.weight, value: bird.weightRange },
    { label: s.colors, value: formatMushroomList(bird.dominantColors) },
    { label: s.flightPattern, value: formatMushroomList(bird.flightPattern) },
    { label: s.flightAltitude, value: formatMushroomList(bird.flightAltitude) },
    {
      label: s.keyMarks,
      value: formatMushroomList(bird.keyIdentificationMarks),
    },
    { label: s.birdType, value: formatMushroomList(bird.birdType) },
    { label: s.conservation, value: bird.conservationStatus },
    { label: s.bestTime, value: tips?.bestTime },
    { label: s.preferredLocations, value: tips?.preferredLocations },
    { label: s.behavioralCues, value: tips?.behavioralCues },
  ].filter((row) => row.value?.trim());

  if (rows.length === 0) return null;

  return (
    <View style={styles.rowsBlock}>
      {rows.map((row, index) => (
        <View key={row.label}>
          <InfoRow
            label={row.label}
            value={row.value!}
            labelColor={textSecondary}
            valueColor={textPrimary}
            rowPaddingVertical={2}
          />
          {index < rows.length - 1 ? (
            <View style={styles.rowDivider} />
          ) : null}
        </View>
      ))}
    </View>
  );
}

export function BirdHabitatRows({
  bird,
  textPrimary,
  textSecondary,
}: {
  bird: MushroomDetail;
  textPrimary: string;
  textSecondary: string;
}) {
  const s = COLLECTION_STRINGS.birdDetails.habitat;
  const rows = [
    { label: s.habitat, value: formatMushroomList(bird.habitatType) },
    { label: s.diet, value: formatMushroomList(bird.diet) },
    {
      label: s.distribution,
      value: formatMushroomList(
        bird.geographicDistribution?.length
          ? bird.geographicDistribution
          : bird.commonlyFoundIn
      ),
    },
  ].filter((row) => row.value?.trim());

  if (rows.length === 0) return null;

  return (
    <View style={styles.rowsBlock}>
      {rows.map((row, index) => (
        <View key={row.label}>
          <InfoRow
            label={row.label}
            value={row.value!}
            labelColor={textSecondary}
            valueColor={textPrimary}
            rowPaddingVertical={2}
          />
          {index < rows.length - 1 ? (
            <View style={styles.rowDivider} />
          ) : null}
        </View>
      ))}
    </View>
  );
}

export function BirdGeographicRangeMap({
  textSecondary,
  surfaceSecondary,
  locked = false,
  rangeDetails,
  customLocation,
  mapCenter,
}: {
  textPrimary: string;
  textSecondary: string;
  surfaceSecondary: string;
  locked?: boolean;
  rangeDetails?: BirdRangeDetails;
  customLocation?: string;
  /** When backend provides GeoJSON polygons, center the static map here until overlay ships. */
  mapCenter?: { lat: number; lng: number };
}) {
  const semantic = useSemanticColors();
  const strings = COLLECTION_STRINGS.birdDetails.geoRange;
  const legend = [
    { color: semantic.content.link, label: strings.nonBreeding },
    { color: semantic.content.warning, label: strings.breeding },
    { color: semantic.content.brand1, label: strings.yearRound },
    { color: semantic.content.success, label: strings.migration },
  ];
  const center = mapCenter ?? { lat: 39.8283, lng: -98.5795 };
  const rangeHint =
    rangeDetails?.yearRound ||
    rangeDetails?.breeding ||
    rangeDetails?.migration ||
    customLocation;
  const showInteractiveMap = !locked;

  return (
    <View style={styles.geoBlock}>
      <View style={[styles.geoMapPlaceholder, { backgroundColor: surfaceSecondary }]}>
        {showInteractiveMap ? (
          <StaticMap
            latitude={center.lat}
            longitude={center.lng}
            width={320}
            height={160}
            zoom={mapCenter ? 6 : 3}
            mapType="terrain"
            markerColor="red"
            style={styles.geoStaticMap}
          />
        ) : (
          <>
            <MaterialIcons name="map" size={40} color={textSecondary} />
            <Text style={[styles.geoMapHint, { color: textSecondary }]}>
              {rangeHint || strings.placeholder}
            </Text>
          </>
        )}
      </View>
      {rangeHint && showInteractiveMap ? (
        <Text style={[styles.geoRangeSummary, { color: textSecondary }]}>
          {rangeHint}
        </Text>
      ) : null}
      <View style={styles.legendRow}>
        {legend.map((item) => (
          <View key={item.label} style={styles.legendItem}>
            <View style={[styles.legendSwatch, { backgroundColor: item.color }]} />
            <Text style={[styles.legendText, { color: textSecondary }]}>
              {item.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export function BirdRecordSoundCta({
  textPrimary,
  surfaceSecondary,
  onPress,
}: {
  textPrimary: string;
  surfaceSecondary: string;
  onPress: () => void;
}) {
  const strings = COLLECTION_STRINGS.birdDetails.sounds;
  return (
    <TouchableOpacity
      style={[styles.recordCta, { backgroundColor: surfaceSecondary }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.recordCtaIcon}>
        <AppImage
          source={Images.soundRecordCta}
          style={styles.recordCtaImage}
          resizeMode="contain"
        />
      </View>
      <View style={styles.recordCtaCopy}>
        <Text style={[styles.recordCtaTitle, { color: textPrimary }]}>
          {strings.recordCta}
        </Text>
        <Text style={[styles.recordCtaHint, { color: textPrimary }]}>
          {strings.recordHint}
        </Text>
      </View>
      <MaterialIcons name="chevron-right" size={22} color={textPrimary} />
    </TouchableOpacity>
  );
}

export function BirdRecordSoundCtaNav({
  textPrimary,
  surfaceSecondary,
}: {
  textPrimary: string;
  surfaceSecondary: string;
}) {
  const navigation = useNavigation();
  return (
    <BirdRecordSoundCta
      textPrimary={textPrimary}
      surfaceSecondary={surfaceSecondary}
      onPress={() => navigateToSoundIdentify(navigation)}
    />
  );
}

const styles = StyleSheet.create({
  sectionBlock: {
    gap: spacing[3],
  },
  rowsBlock: {
    gap: spacing[1],
  },
  rowDivider: {
    height: 1,
    backgroundColor: "#E7E7E7",
    marginVertical: spacing[1],
  },
  soundsScroll: {
    gap: spacing[3],
    paddingVertical: spacing[1],
  },
  soundCard: {
    width: 140,
    borderRadius: Radius.md,
    padding: spacing[3],
    alignItems: "center",
    gap: spacing[2],
  },
  soundIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.06)",
  },
  soundIconWrapActive: {
    backgroundColor: "#2196F3",
  },
  soundPlayIcon: {
    width: 28,
    height: 28,
  },
  soundLabel: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    lineHeight: 20,
  },
  soundHint: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    lineHeight: 16,
  },
  rangeBars: {
    gap: spacing[3],
  },
  rangeRow: {
    gap: spacing[2],
  },
  rangeLabel: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    lineHeight: 18,
  },
  monthBar: {
    flexDirection: "row",
    gap: 2,
  },
  monthCell: {
    flex: 1,
    minHeight: 28,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.08)",
  },
  monthCellLabel: {
    fontFamily: FONTS.medium,
    fontSize: 9,
    lineHeight: 12,
  },
  legendRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[3],
    marginTop: spacing[1],
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendSwatch: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  legendText: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    lineHeight: 14,
  },
  recordCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    padding: spacing[3],
    borderRadius: Radius.md,
    marginTop: spacing[2],
  },
  recordCtaIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.06)",
  },
  recordCtaImage: {
    width: 36,
    height: 36,
  },
  recordCtaCopy: { flex: 1, gap: 2 },
  recordCtaTitle: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    lineHeight: 20,
  },
  recordCtaHint: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    lineHeight: 16,
    opacity: 0.72,
  },
  geoBlock: {
    gap: spacing[3],
    marginBottom: spacing[2],
  },
  geoMapPlaceholder: {
    height: 160,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[2],
    padding: spacing[1],
    overflow: "hidden",
  },
  geoStaticMap: {
    width: "100%",
    height: "100%",
    borderRadius: Radius.md,
  },
  geoMapHint: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    lineHeight: 16,
    textAlign: "center",
  },
  geoRangeSummary: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    lineHeight: 16,
    marginTop: spacing[2],
  },
});
