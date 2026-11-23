/**
 * Step-by-step "Custom Location" field — Figma 9380:170051.
 * Pill input (radius 100, px16/py8, gap 12) that searches inline; matches appear in a
 * dropdown directly under the pill (4px gap, radius 12, p12, gap 8, 3 rows visible).
 * Replaces the ChangeLocationBottomSheet hand-off for the wizard.
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Text } from "../../../atoms";
import { WizardMapPinIcon } from "../../../assets";
import { FONTS } from "../../../common/typography";
import { useTheme } from "../../../hooks/useTheme";
// Explore's search: geocode.maps.co when GEOCODING_API_KEY is set, otherwise
// Mapbox Geocoding v6 via MAPBOX_ACCESS_TOKEN (the shared util returns nothing without the key).
import {
  geocodeAddress,
  searchAddressSuggestions,
} from "../../explore/utils/geocodingApi";
import { sanitizeLocationSearchQuery } from "../../camera/locationQuery.helpers";
import type { WizardRecentLocation } from "../stepByStep.types";

const SEARCH_DEBOUNCE_MS = 300;
const MIN_SEARCH_CHARS = 3;
/** Figma dropdown shows 3 rows: 12 + (32 × 3) + (8 × 2) + 12. */
const DROPDOWN_MAX_HEIGHT = 136;

type Suggestion = {
  key: string;
  label: string;
  latitude: number;
  longitude: number;
};

type Props = {
  /** Current committed label (shown when the field is not being edited). */
  value: string;
  placeholder: string;
  searchingLabel: string;
  emptyLabel: string;
  selected: boolean;
  onSelect: (location: WizardRecentLocation) => void;
};

export function WizardLocationSearchField({
  value,
  placeholder,
  searchingLabel,
  emptyLabel,
  selected,
  onSelect,
}: Props) {
  const theme = useTheme();
  const colors = theme.colors;
  const isDark = theme.mode === "dark";
  const inputRef = useRef<TextInput>(null);

  const committed = sanitizeLocationSearchQuery(value);
  const [query, setQuery] = useState(committed);
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  // Keep the field in sync with the committed answer while not editing.
  useEffect(() => {
    if (!focused) setQuery(committed);
  }, [committed, focused]);

  useEffect(() => {
    if (!focused) return;
    const trimmed = query.trim();
    if (trimmed.length < MIN_SEARCH_CHARS || trimmed === committed) {
      setSuggestions([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    const controller = new AbortController();
    // Loading from the first keystroke (covers the debounce window too).
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const results = await searchAddressSuggestions(trimmed, {
          signal: controller.signal,
        });
        if (cancelled) return;
        setSuggestions(
          results.map((item) => ({
            key: item.placeId,
            label: item.formattedAddress || item.name,
            latitude: item.location?.latitude ?? 0,
            longitude: item.location?.longitude ?? 0,
          }))
        );
      } catch {
        if (!cancelled) setSuggestions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, focused, committed]);

  const commit = useCallback(
    (location: WizardRecentLocation) => {
      Keyboard.dismiss();
      inputRef.current?.blur();
      setSuggestions([]);
      setQuery(location.label);
      onSelect(location);
    },
    [onSelect]
  );

  const handleSubmit = useCallback(async () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    const first = suggestions[0];
    if (first) {
      commit(first);
      return;
    }
    try {
      const geocoded = await geocodeAddress(trimmed);
      commit({
        label: geocoded.formattedAddress || trimmed,
        latitude: geocoded.latitude,
        longitude: geocoded.longitude,
      });
    } catch {
      commit({ label: trimmed, latitude: 0, longitude: 0 });
    }
  }, [commit, query, suggestions]);

  // Open the dropdown as soon as 3+ letters are typed (Figma): show progress while the
  // search runs and an empty state if nothing matches, so it never looks unresponsive.
  const typed = query.trim();
  const showDropdown =
    focused && typed.length >= MIN_SEARCH_CHARS && typed !== committed;
  const statusLabel =
    suggestions.length > 0 ? null : loading ? searchingLabel : emptyLabel;

  return (
    <View style={styles.wrap}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => inputRef.current?.focus()}
        style={[
          styles.pill,
          {
            backgroundColor: colors.surfacePrimary,
            borderColor: selected && !focused ? colors.primaryCTA : colors.border0,
          },
        ]}
      >
        <WizardMapPinIcon width={20} height={20} />
        <TextInput
          ref={inputRef}
          value={query}
          onChangeText={setQuery}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onSubmitEditing={() => void handleSubmit()}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          selectionColor={isDark ? "#16B6B4" : colors.primaryCTA}
          cursorColor={isDark ? "#16B6B4" : colors.primaryCTA}
          returnKeyType="search"
          autoCorrect={false}
          allowFontScaling={false}
          numberOfLines={1}
          style={[styles.input, { color: colors.textPrimary }]}
        />
        {loading ? (
          <ActivityIndicator size="small" color={colors.primaryCTA} />
        ) : null}
      </TouchableOpacity>

      {showDropdown ? (
        <View
          style={[
            styles.dropdown,
            {
              backgroundColor: colors.surfacePrimary,
              borderColor: colors.border0,
              shadowColor: isDark ? "#FFFFFF" : "#000000",
              shadowOpacity: isDark ? 0.15 : 0.08,
            },
          ]}
        >
          <ScrollView
            style={styles.dropdownScroll}
            contentContainerStyle={styles.dropdownContent}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            indicatorStyle={isDark ? "white" : "black"}
          >
            {statusLabel ? (
              <View style={styles.dropdownRow}>
                <Text
                  allowFontScaling={false}
                  style={[styles.dropdownLabel, { color: colors.textTertiary }]}
                >
                  {statusLabel}
                </Text>
              </View>
            ) : null}
            {suggestions.map((item) => (
              <TouchableOpacity
                key={item.key}
                onPress={() =>
                  commit({
                    label: item.label,
                    latitude: item.latitude,
                    longitude: item.longitude,
                  })
                }
                style={styles.dropdownRow}
              >
                <Text
                  allowFontScaling={false}
                  numberOfLines={1}
                  style={[styles.dropdownLabel, { color: colors.textPrimary }]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  // Raised so the dropdown overlays the "Current location" / "Recently Used" sections.
  wrap: {
    zIndex: 10,
    elevation: 10,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    height: 40,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 100,
  },
  input: {
    flex: 1,
    padding: 0,
    fontFamily: FONTS.regular,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: -0.16,
  },
  dropdown: {
    position: "absolute",
    top: 44,
    left: 0,
    right: 0,
    borderWidth: 1,
    borderRadius: 12,
    shadowOffset: { width: 4, height: 4 },
    shadowRadius: 4,
    elevation: 10,
  },
  dropdownScroll: {
    maxHeight: DROPDOWN_MAX_HEIGHT,
  },
  dropdownContent: {
    padding: 12,
    gap: 8,
  },
  dropdownRow: {
    padding: 4,
  },
  dropdownLabel: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: -0.16,
  },
});
