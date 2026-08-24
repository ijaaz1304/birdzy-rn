/**
 * Merlin-style step-by-step bird finder (POST /core/archetypes/step-by-step).
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../../hooks/useTheme";
import { Text, NavBackIcon, Button } from "../../../atoms";
import { HomeStackParamList } from "../../../navigation/types";
import { archetypeService } from "../../../services/archetype/archetype.service";
import { MushroomCard } from "../../../organisms";
import {
  mapMushroomToCatalogueCard,
} from "../../../utils/mushroomCardUtils";
import type { MushroomArchetypeListItem } from "../../../services/api/features/core.api.types";
import { resolveBirdDiscoveryLocation } from "../../../utils/birdDiscoveryLocation.helpers";
import { HOME_STRINGS } from "../../../config/strings/home.strings";
import { HIT_SLOP } from "../../../constants/uiConstants";
import { spacing } from "../../../design-system/spacing";

type Nav = NativeStackNavigationProp<HomeStackParamList, "StepByStep">;

const BIRD_SIZE_OPTIONS = [
  { id: "all", label: "All sizes" },
  { id: "small", label: "Sparrow-sized" },
  { id: "medium", label: "Robin-sized" },
  { id: "large", label: "Crow-sized" },
  { id: "xlarge", label: "Goose-sized" },
  { id: "xxlarge", label: "Eagle-sized" },
] as const;

const COLOR_OPTIONS = [
  "Black",
  "White",
  "Brown",
  "Gray",
  "Red",
  "Yellow",
  "Orange",
  "Blue",
  "Green",
] as const;

const BEHAVIOR_OPTIONS = [
  "Flying",
  "Perching",
  "Swimming",
  "Walking",
  "Feeding",
  "Calling",
] as const;

type WizardStep = "location" | "date" | "size" | "colors" | "behavior" | "results";

const STEP_ORDER: WizardStep[] = [
  "location",
  "date",
  "size",
  "colors",
  "behavior",
  "results",
];

function isoDateOffset(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

function filterWizardResults(
  items: MushroomArchetypeListItem[],
  selectedColors: string[],
  selectedBehaviors: string[]
): MushroomArchetypeListItem[] {
  let result = items;

  if (selectedColors.length > 0) {
    result = result.filter((item) => {
      const raw = item as MushroomArchetypeListItem & {
        dominantColors?: string[];
      };
      const colors = raw.dominantColors;
      if (!Array.isArray(colors) || colors.length === 0) return true;
      return selectedColors.some((pick) =>
        colors.some((c) => c.toLowerCase().includes(pick.toLowerCase()))
      );
    });
  }

  if (selectedBehaviors.length > 0) {
    result = result.filter((item) => {
      const raw = item as MushroomArchetypeListItem & {
        birdType?: string[];
        keyIdentificationMarks?: string[];
        summary?: string;
      };
      const haystack = [
        ...(Array.isArray(raw.birdType) ? raw.birdType : []),
        ...(Array.isArray(raw.keyIdentificationMarks)
          ? raw.keyIdentificationMarks
          : []),
        raw.summary ?? "",
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.trim()) return true;
      return selectedBehaviors.some((b) =>
        haystack.includes(b.toLowerCase())
      );
    });
  }

  return result;
}

function SelectableChips({
  options,
  selected,
  onToggle,
  colors,
}: {
  options: readonly string[];
  selected: string[];
  onToggle: (value: string) => void;
  colors: ReturnType<typeof useTheme>["colors"];
}) {
  return (
    <View style={styles.chipsRow}>
      {options.map((opt) => {
        const active = selected.includes(opt);
        return (
          <TouchableOpacity
            key={opt}
            onPress={() => onToggle(opt)}
            style={[
              styles.chip,
              {
                backgroundColor: active
                  ? colors.primary
                  : colors.surfaceSecondary,
                borderColor: active ? colors.primary : colors.border,
              },
            ]}
          >
            <Text
              variant="caption"
              size="small"
              weight="medium"
              color={active ? "surface" : "textSecondary"}
            >
              {opt}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export const StepByStepScreen: React.FC = () => {
  const theme = useTheme();
  const colors = theme.colors;
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const strings = HOME_STRINGS.discovery.stepByStep;

  const [stepIndex, setStepIndex] = useState(0);
  const step = STEP_ORDER[stepIndex] ?? "location";

  const [locationLabel, setLocationLabel] = useState<string | null>(null);
  const [locationReady, setLocationReady] = useState(false);
  const [seenDate, setSeenDate] = useState(isoDateOffset(0));
  const [selectedSize, setSelectedSize] = useState<string>("all");
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedBehaviors, setSelectedBehaviors] = useState<string[]>([]);

  const [allItems, setAllItems] = useState<MushroomArchetypeListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredItems = useMemo(
    () => filterWizardResults(allItems, selectedColors, selectedBehaviors),
    [allItems, selectedBehaviors, selectedColors]
  );

  const cards = useMemo(
    () => filteredItems.map((item) => mapMushroomToCatalogueCard(item)),
    [filteredItems]
  );

  const progress = ((stepIndex + 1) / STEP_ORDER.length) * 100;

  const toggleInList = (value: string, list: string[], setter: (v: string[]) => void) => {
    setter(
      list.includes(value)
        ? list.filter((v) => v !== value)
        : [...list, value]
    );
  };

  useEffect(() => {
    void (async () => {
      const discovery = await resolveBirdDiscoveryLocation();
      if (discovery) {
        setLocationReady(true);
        setLocationLabel(discovery.label);
      }
    })();
  }, []);

  const loadBirds = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const discovery = await resolveBirdDiscoveryLocation();
      if (!discovery) {
        setError(strings.locationRequired);
        setAllItems([]);
        return;
      }

      const birdSize = selectedSize === "all" ? undefined : [selectedSize];
      const { data } = await archetypeService.stepByStep(
        {
          location: {
            lat: discovery.coords[0],
            lng: discovery.coords[1],
          },
          seenDate,
          birdSize,
          region:
            discovery.source !== "gps" ? discovery.regionId : undefined,
        },
        { pageNo: 0, pageSize: 60 }
      );
      setAllItems(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : strings.loadError);
      setAllItems([]);
    } finally {
      setLoading(false);
    }
  }, [seenDate, selectedSize, strings.loadError, strings.locationRequired]);

  useEffect(() => {
    if (step !== "results") return;
    void loadBirds();
  }, [step, loadBirds]);

  const goNext = () => {
    if (stepIndex < STEP_ORDER.length - 1) {
      setStepIndex((i) => i + 1);
    }
  };

  const goBack = () => {
    if (stepIndex > 0) {
      setStepIndex((i) => i - 1);
    } else {
      navigation.goBack();
    }
  };

  const renderResults = () => {
    if (loading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text variant="body" color="textSecondary">
            {strings.refining}
          </Text>
        </View>
      );
    }
    if (error) {
      return (
        <View style={styles.centered}>
          <Text variant="body" color="textSecondary" style={styles.errorText}>
            {error}
          </Text>
          <TouchableOpacity onPress={() => void loadBirds()}>
            <Text variant="body" weight="semibold" color="primary">
              {strings.retry}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <FlatList
        data={cards}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => {
          const raw = filteredItems[index] as MushroomArchetypeListItem & {
            distanceFromUser?: number;
          };
          const distance =
            raw?.distanceFromUser != null
              ? `${Math.round(raw.distanceFromUser)} m away`
              : undefined;
          return (
            <MushroomCard
              id={item.id}
              name={item.name}
              scientificName={item.scientificName}
              image={item.image}
              imageUrls={item.imageUrls}
              description={distance}
              variant="compact"
              imageAspectRatio={1}
              onPress={() =>
                navigation.navigate("BirdDetails", {
                  mushroomId: item.id,
                  source: "home",
                })
              }
              style={styles.card}
            />
          );
        }}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text variant="body" color="textSecondary" style={styles.empty}>
            {strings.empty}
          </Text>
        }
      />
    );
  };

  const renderStepBody = () => {
    switch (step) {
      case "location":
        return (
          <>
            <Text variant="headline" size="small" weight="bold" style={styles.stepTitle}>
              {strings.steps.location}
            </Text>
            <Text variant="body" size="small" color="textSecondary" style={styles.hint}>
              {strings.locationHint}
            </Text>
            <Text variant="body" size="medium" weight="semibold">
              {locationReady
                ? locationLabel ?? strings.locationDetected
                : strings.locationRequired}
            </Text>
          </>
        );
      case "date":
        return (
          <>
            <Text variant="headline" size="small" weight="bold" style={styles.stepTitle}>
              {strings.steps.date}
            </Text>
            <View style={styles.chipsRow}>
              {[
                { id: isoDateOffset(0), label: strings.dateOptions.today },
                { id: isoDateOffset(1), label: strings.dateOptions.yesterday },
              ].map((opt) => {
                const active = seenDate === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    onPress={() => setSeenDate(opt.id)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: active
                          ? colors.primary
                          : colors.surfaceSecondary,
                        borderColor: active ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      variant="caption"
                      size="small"
                      weight="medium"
                      color={active ? "surface" : "textSecondary"}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        );
      case "size":
        return (
          <>
            <Text variant="headline" size="small" weight="bold" style={styles.stepTitle}>
              {strings.steps.size}
            </Text>
            <View style={styles.chipsRow}>
              {BIRD_SIZE_OPTIONS.map((opt) => {
                const active = selectedSize === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    onPress={() => setSelectedSize(opt.id)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: active
                          ? colors.primary
                          : colors.surfaceSecondary,
                        borderColor: active ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      variant="caption"
                      size="small"
                      weight="medium"
                      color={active ? "surface" : "textSecondary"}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        );
      case "colors":
        return (
          <>
            <Text variant="headline" size="small" weight="bold" style={styles.stepTitle}>
              {strings.steps.colors}
            </Text>
            <Text variant="body" size="small" color="textSecondary" style={styles.hint}>
              {strings.colorsHint}
            </Text>
            <SelectableChips
              options={COLOR_OPTIONS}
              selected={selectedColors}
              onToggle={(v) => toggleInList(v, selectedColors, setSelectedColors)}
              colors={colors}
            />
          </>
        );
      case "behavior":
        return (
          <>
            <Text variant="headline" size="small" weight="bold" style={styles.stepTitle}>
              {strings.steps.behavior}
            </Text>
            <Text variant="body" size="small" color="textSecondary" style={styles.hint}>
              {strings.behaviorHint}
            </Text>
            <SelectableChips
              options={BEHAVIOR_OPTIONS}
              selected={selectedBehaviors}
              onToggle={(v) =>
                toggleInList(v, selectedBehaviors, setSelectedBehaviors)
              }
              colors={colors}
            />
          </>
        );
      case "results":
        return (
          <>
            <Text variant="headline" size="small" weight="bold" style={styles.stepTitle}>
              {strings.steps.results}
            </Text>
            {renderResults()}
          </>
        );
      default:
        return null;
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.surfacePrimary }]}>
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View
          style={[
            styles.header,
            { paddingTop: insets.top > 0 ? 0 : spacing[2] },
          ]}
        >
          <TouchableOpacity onPress={goBack} hitSlop={HIT_SLOP.CLOSE}>
            <NavBackIcon color={colors.textPrimary} size={24} />
          </TouchableOpacity>
          <Text
            variant="headline"
            size="medium"
            weight="bold"
            style={styles.headerTitle}
          >
            {strings.title}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${progress}%`, backgroundColor: colors.primary },
            ]}
          />
        </View>

        <Text
          variant="body"
          size="small"
          color="textSecondary"
          style={styles.subtitle}
        >
          {strings.subtitle}
        </Text>

        <View style={step === "results" ? styles.resultsBody : styles.stepBody}>
          {renderStepBody()}
        </View>

        {step !== "results" ? (
          <View
            style={[
              styles.footer,
              { paddingBottom: Math.max(insets.bottom, spacing[4]) },
            ]}
          >
            <Button
              title={step === "behavior" ? strings.seeResults : strings.next}
              variant="primary"
              size="large"
              fullWidth
              onPress={goNext}
            />
          </View>
        ) : null}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[2],
    gap: spacing[2],
  },
  headerTitle: { flex: 1, textAlign: "center" },
  headerSpacer: { width: 24 },
  progressTrack: {
    height: 4,
    marginHorizontal: spacing[4],
    marginBottom: spacing[2],
    borderRadius: 2,
    backgroundColor: "rgba(0,0,0,0.08)",
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 2 },
  subtitle: {
    paddingHorizontal: spacing[6],
    marginBottom: spacing[3],
  },
  stepBody: {
    flex: 1,
    paddingHorizontal: spacing[4],
    gap: spacing[3],
  },
  resultsBody: {
    flex: 1,
    paddingHorizontal: spacing[4],
  },
  stepTitle: { marginBottom: spacing[1] },
  hint: { marginBottom: spacing[2] },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[1],
  },
  chip: {
    paddingHorizontal: spacing[2],
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  listContent: {
    paddingBottom: spacing[8],
    gap: spacing[2],
  },
  card: { marginBottom: spacing[2] },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing[6],
    gap: spacing[4],
  },
  errorText: { textAlign: "center" },
  empty: { textAlign: "center", marginTop: spacing[8] },
  footer: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2],
  },
});
