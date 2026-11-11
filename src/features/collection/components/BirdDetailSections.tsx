/**
 * Bird-specific detail UI — sounds player, range map, and trait rows.
 */

import { AppImage } from "@/components/AppImage";
import React, { useCallback, useMemo, useState } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import {
  BirdSizeScaleGraphic,
  Images,
} from "../../../assets";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
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
import { APP_COLORS } from "../../../config/colors";
import { useSemanticColors } from "../../../hooks/useSemanticColors";
import {
  BIRD_SIZE_SCALE_COUNT,
  getBirdDetailBlocks,
  hasAnyValue,
} from "../utils/birdDetailContent";
import { buildBirdSoundListItems } from "../utils/birdSoundListItems";
import { useBirdSoundDurations } from "../hooks/useBirdSoundDurations";
import { BirdSoundRow } from "./BirdSoundRow";

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
      <Text allowFontScaling={false}
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
            <Text allowFontScaling={false}
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
                <Text allowFontScaling={false} style={[styles.legendText, { color: textSecondary }]}>
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

export const BIRD_SOUND_PREVIEW_COUNT = 2;

export function BirdSoundsSection({
  soundUrls,
  userCapturedSounds,
  customLocation,
  createdAt,
  updatedAt,
  textPrimary,
  textSecondary,
  surfaceSecondary,
}: {
  soundUrls: string[];
  userCapturedSounds?: string[];
  customLocation?: string;
  createdAt?: string;
  updatedAt?: string;
  textPrimary: string;
  textSecondary: string;
  surfaceSecondary: string;
}) {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const allUrls = useMemo(
    () => [...soundUrls, ...(userCapturedSounds ?? [])],
    [soundUrls, userCapturedSounds]
  );
  const durationsSec = useBirdSoundDurations(allUrls);

  const items = useMemo(
    () =>
      buildBirdSoundListItems({
        soundUrls,
        userCapturedSounds,
        customLocation,
        createdAt,
        updatedAt,
        durationsSec,
      }),
    [
      soundUrls,
      userCapturedSounds,
      customLocation,
      createdAt,
      updatedAt,
      durationsSec,
    ]
  );

  useFocusEffect(
    useCallback(() => {
      return () => {
        setPlayingId(null);
        void soundRecordingService.stopPlayback();
      };
    }, [])
  );

  const togglePlay = useCallback(
    async (id: string, url: string) => {
      if (playingId === id) {
        setPlayingId(null);
        void soundRecordingService.stopPlayback();
        return;
      }
      setPlayingId(id);
      try {
        await soundRecordingService.play(url, {
          onEnd: () => {
            setPlayingId((current) => (current === id ? null : current));
          },
        });
      } catch {
        setPlayingId((current) => (current === id ? null : current));
      }
    },
    [playingId]
  );

  if (items.length === 0) return null;

  const visibleItems = items.slice(0, BIRD_SOUND_PREVIEW_COUNT);

  return (
    <View style={styles.soundList}>
      {visibleItems.map((item) => (
        <BirdSoundRow
          key={item.id}
          item={item}
          isPlaying={playingId === item.id}
          onPress={() => void togglePlay(item.id, item.url)}
          surfaceSecondary={surfaceSecondary}
          textPrimary={textPrimary}
          textSecondary={textSecondary}
        />
      ))}
    </View>
  );
}

export function BirdLabeledBlock({
  title,
  body,
  textPrimary,
  textSecondary,
}: {
  title: string;
  body?: string;
  textPrimary: string;
  textSecondary: string;
}) {
  if (!body?.trim()) return null;
  return (
    <View style={styles.labeledBlock}>
      <Text allowFontScaling={false} style={[styles.blockTitle, { color: textPrimary }]}>{title}</Text>
      <Text allowFontScaling={false} style={[styles.blockBody, { color: textSecondary }]}>{body}</Text>
    </View>
  );
}

export function BirdOverviewExtras({
  bird,
  textPrimary,
  textSecondary,
}: {
  bird: MushroomDetail;
  textPrimary: string;
  textSecondary: string;
  isDark: boolean;
}) {
  const strings = COLLECTION_STRINGS.birdDetails.overview;
  const { familyDescription } = getBirdDetailBlocks(bird);

  // Size/color chips hidden for now; keep family description when present.
  if (!familyDescription) return null;

  return (
    <View style={styles.overviewExtras}>
      {/*
      {sizeScale ? (
        <View style={styles.overviewExtraBlock}>
          <Text allowFontScaling={false} style={[styles.blockTitle, { color: textPrimary }]}>
            {strings.size}
          </Text>
          <View style={styles.sizeTag}>
            <Text allowFontScaling={false} style={[styles.sizeTagLabel, { color: textPrimary }]}>
              {sizeScale.label}
            </Text>
          </View>
        </View>
      ) : null}
      {colors.length > 0 ? (
        <View style={styles.overviewExtraBlock}>
          <Text allowFontScaling={false} style={[styles.blockTitle, { color: textPrimary }]}>
            {strings.colors}
          </Text>
          <View style={styles.colorChips}>
            {colors.map((chip) => (
              <View
                key={chip.label}
                style={[
                  styles.colorChip,
                  {
                    borderColor: chipBorder,
                    backgroundColor: isDark ? "#1A1A1A" : "#FFFFFF",
                  },
                ]}
              >
                <View
                  style={[
                    styles.colorDot,
                    {
                      backgroundColor: chip.hex,
                      borderColor:
                        chip.hex.toLowerCase() === "#ffffff"
                          ? chipBorder
                          : chip.hex,
                    },
                  ]}
                />
                <Text allowFontScaling={false} style={[styles.colorChipLabel, { color: textPrimary }]}>
                  {chip.label}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}
      */}
      {familyDescription ? (
        <BirdLabeledBlock
          title={strings.family}
          body={familyDescription}
          textPrimary={textPrimary}
          textSecondary={textSecondary}
        />
      ) : null}
    </View>
  );
}

function BirdSizeScale({
  sizeScale,
  textPrimary,
  textSecondary,
}: {
  sizeScale: { label: string; index: number };
  textPrimary: string;
  textSecondary: string;
}) {
  const strings = COLLECTION_STRINGS.birdDetails.characteristics;
  return (
    <View style={styles.sizeScaleBlock}>
      <Text allowFontScaling={false} style={[styles.blockTitle, { color: textPrimary }]}>
        {strings.size}
      </Text>
      <Text allowFontScaling={false} style={[styles.sizeScaleLabel, { color: textSecondary }]}>
        {sizeScale.label}
      </Text>
      <View style={styles.sizeDotsRow}>
        {Array.from({ length: BIRD_SIZE_SCALE_COUNT }).map((_, index) => {
          const selected = index === sizeScale.index;
          return (
            <View
              key={`size-dot-${index}`}
              style={[
                styles.sizeDot,
                selected ? styles.sizeDotSelected : styles.sizeDotIdle,
              ]}
            />
          );
        })}
      </View>
      <BirdSizeScaleGraphic
        width="100%"
        height={78}
        preserveAspectRatio="xMidYMid meet"
      />
    </View>
  );
}

export function BirdCharacteristicsSection({
  bird,
  textPrimary,
  textSecondary,
}: {
  bird: MushroomDetail;
  textPrimary: string;
  textSecondary: string;
}) {
  const strings = COLLECTION_STRINGS.birdDetails.characteristics;
  const { sizeScale, characteristics } = getBirdDetailBlocks(bird);
  const hasText = hasAnyValue(characteristics);
  if (!sizeScale && !hasText) return null;

  return (
    <View style={styles.topicStack}>
      {sizeScale ? (
        <BirdSizeScale
          sizeScale={sizeScale}
          textPrimary={textPrimary}
          textSecondary={textSecondary}
        />
      ) : null}
      <BirdLabeledBlock
        title={strings.shape}
        body={characteristics.shape}
        textPrimary={textPrimary}
        textSecondary={textSecondary}
      />
      <BirdLabeledBlock
        title={strings.beak}
        body={characteristics.beak}
        textPrimary={textPrimary}
        textSecondary={textSecondary}
      />
      <BirdLabeledBlock
        title={strings.tail}
        body={characteristics.tail}
        textPrimary={textPrimary}
        textSecondary={textSecondary}
      />
      <BirdLabeledBlock
        title={strings.legs}
        body={characteristics.legs}
        textPrimary={textPrimary}
        textSecondary={textSecondary}
      />
      <BirdLabeledBlock
        title={strings.length}
        body={characteristics.length}
        textPrimary={textPrimary}
        textSecondary={textSecondary}
      />
      <BirdLabeledBlock
        title={strings.wingspan}
        body={characteristics.wingspan}
        textPrimary={textPrimary}
        textSecondary={textSecondary}
      />
      <BirdLabeledBlock
        title={strings.weight}
        body={characteristics.weight}
        textPrimary={textPrimary}
        textSecondary={textSecondary}
      />
    </View>
  );
}

export function BirdBehaviorSection({
  bird,
  textPrimary,
  textSecondary,
}: {
  bird: MushroomDetail;
  textPrimary: string;
  textSecondary: string;
}) {
  const strings = COLLECTION_STRINGS.birdDetails.behavior;
  const { behavior } = getBirdDetailBlocks(bird);
  if (!hasAnyValue(behavior)) return null;
  return (
    <View style={styles.topicStack}>
      <BirdLabeledBlock
        title={strings.feeding}
        body={behavior.feeding}
        textPrimary={textPrimary}
        textSecondary={textSecondary}
      />
      <BirdLabeledBlock
        title={strings.flight}
        body={behavior.flight}
        textPrimary={textPrimary}
        textSecondary={textSecondary}
      />
      <BirdLabeledBlock
        title={strings.vocal}
        body={behavior.vocal}
        textPrimary={textPrimary}
        textSecondary={textSecondary}
      />
      <BirdLabeledBlock
        title={strings.territoriality}
        body={behavior.territoriality}
        textPrimary={textPrimary}
        textSecondary={textSecondary}
      />
      <BirdLabeledBlock
        title={strings.social}
        body={behavior.social}
        textPrimary={textPrimary}
        textSecondary={textSecondary}
      />
    </View>
  );
}

export function BirdFeedingDietSection({
  bird,
  textPrimary,
  textSecondary,
}: {
  bird: MushroomDetail;
  textPrimary: string;
  textSecondary: string;
}) {
  const strings = COLLECTION_STRINGS.birdDetails.feeding;
  const { feeding } = getBirdDetailBlocks(bird);
  if (!hasAnyValue(feeding)) return null;
  return (
    <View style={styles.topicStack}>
      <BirdLabeledBlock
        title={strings.dietType}
        body={feeding.dietType}
        textPrimary={textPrimary}
        textSecondary={textSecondary}
      />
      <BirdLabeledBlock
        title={strings.feedingStyle}
        body={feeding.feedingStyle}
        textPrimary={textPrimary}
        textSecondary={textSecondary}
      />
      <BirdLabeledBlock
        title={strings.diet}
        body={feeding.diet}
        textPrimary={textPrimary}
        textSecondary={textSecondary}
      />
    </View>
  );
}

export function BirdBreedingSection({
  bird,
  textPrimary,
  textSecondary,
}: {
  bird: MushroomDetail;
  textPrimary: string;
  textSecondary: string;
}) {
  const strings = COLLECTION_STRINGS.birdDetails.breeding;
  const { breeding } = getBirdDetailBlocks(bird);
  if (!hasAnyValue(breeding)) return null;
  return (
    <View style={styles.topicStack}>
      <BirdLabeledBlock
        title={strings.season}
        body={breeding.season}
        textPrimary={textPrimary}
        textSecondary={textSecondary}
      />
      <BirdLabeledBlock
        title={strings.nestType}
        body={breeding.nestType}
        textPrimary={textPrimary}
        textSecondary={textSecondary}
      />
      <BirdLabeledBlock
        title={strings.material}
        body={breeding.material}
        textPrimary={textPrimary}
        textSecondary={textSecondary}
      />
      <BirdLabeledBlock
        title={strings.parentalCare}
        body={breeding.parentalCare}
        textPrimary={textPrimary}
        textSecondary={textSecondary}
      />
    </View>
  );
}

export function BirdMigrationNotes({
  bird,
  textPrimary,
  textSecondary,
}: {
  bird: MushroomDetail;
  textPrimary: string;
  textSecondary: string;
}) {
  const strings = COLLECTION_STRINGS.birdDetails.migration;
  const { migration } = getBirdDetailBlocks(bird);
  if (!hasAnyValue(migration)) return null;
  return (
    <View style={styles.topicStack}>
      <BirdLabeledBlock
        title={strings.resident}
        body={migration.resident}
        textPrimary={textPrimary}
        textSecondary={textSecondary}
      />
      <BirdLabeledBlock
        title={strings.path}
        body={migration.path}
        textPrimary={textPrimary}
        textSecondary={textSecondary}
      />
      <BirdLabeledBlock
        title={strings.seasonal}
        body={migration.seasonal}
        textPrimary={textPrimary}
        textSecondary={textSecondary}
      />
    </View>
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
  const { habitat } = getBirdDetailBlocks(bird);
  if (!hasAnyValue(habitat)) return null;
  return (
    <View style={styles.topicStack}>
      <BirdLabeledBlock
        title={s.habitat}
        body={habitat.habitat}
        textPrimary={textPrimary}
        textSecondary={textSecondary}
      />
      <BirdLabeledBlock
        title={s.preferredLocations}
        body={habitat.preferredLocations}
        textPrimary={textPrimary}
        textSecondary={textSecondary}
      />
      <BirdLabeledBlock
        title={s.bestTime}
        body={habitat.bestTime}
        textPrimary={textPrimary}
        textSecondary={textSecondary}
      />
      <BirdLabeledBlock
        title={s.conservation}
        body={habitat.conservation}
        textPrimary={textPrimary}
        textSecondary={textSecondary}
      />
      <BirdLabeledBlock
        title={s.distribution}
        body={habitat.distribution}
        textPrimary={textPrimary}
        textSecondary={textSecondary}
      />
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
            <Text allowFontScaling={false} style={[styles.geoMapHint, { color: textSecondary }]}>
              {rangeHint || strings.placeholder}
            </Text>
          </>
        )}
      </View>
      {rangeHint && showInteractiveMap ? (
        <Text allowFontScaling={false} style={[styles.geoRangeSummary, { color: textSecondary }]}>
          {rangeHint}
        </Text>
      ) : null}
      <View style={styles.legendRow}>
        {legend.map((item) => (
          <View key={item.label} style={styles.legendItem}>
            <View style={[styles.legendSwatch, { backgroundColor: item.color }]} />
            <Text allowFontScaling={false} style={[styles.legendText, { color: textSecondary }]}>
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
        <Text allowFontScaling={false} style={[styles.recordCtaTitle, { color: textPrimary }]}>
          {strings.recordCta}
        </Text>
        <Text allowFontScaling={false} style={[styles.recordCtaHint, { color: textPrimary }]}>
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
  soundList: {
    gap: spacing[3],
    width: "100%",
  },
  labeledBlock: {
    gap: 12,
    width: "100%",
  },
  blockTitle: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    lineHeight: 24,
  },
  blockBody: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: -0.16,
  },
  overviewExtras: {
    marginTop: 20,
    gap: 20,
    width: "100%",
  },
  overviewExtraBlock: {
    gap: 12,
    width: "100%",
  },
  sizeTag: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#41EDE9",
    borderRadius: 24,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  sizeTagLabel: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  colorChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  colorChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  colorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  colorChipLabel: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  topicStack: {
    gap: 20,
    width: "100%",
  },
  sizeScaleBlock: {
    gap: 8,
    width: "100%",
  },
  sizeScaleLabel: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  sizeDotsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    width: "100%",
  },
  sizeDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
  },
  sizeDotSelected: {
    borderColor: APP_COLORS.ctaPrimary,
    backgroundColor: APP_COLORS.ctaPrimary,
  },
  sizeDotIdle: {
    borderColor: "#E7E7E7",
    backgroundColor: "#FFFFFF",
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
