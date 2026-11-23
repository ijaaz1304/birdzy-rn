import { EXPLORE_COPY } from "../content/explore.strings";
import { FONTS } from "../../../common/typography";
/** Location search with debouncing, provider pacing and cancelable requests. */

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  type ListRenderItemInfo,
  Keyboard,
  ActivityIndicator,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { Text } from "../../../atoms";
import { useTheme, useIsDark } from "../../../hooks/useTheme";
import { Radius } from "../../../design";
import { spacing } from "../../../design-system/spacing";
import {
  ExploreLocationSearchIcon,
  ExploreLocationSearchIconDark,
  ExploreSearchTargetIcon,
  ExploreSearchTargetIconDark,
} from "../assets";
import type { GeocodingSearchResult } from "@/features/explore/utils/geocodingApi";
import { useLocationSuggestions } from "@/features/explore/hooks/useLocationSuggestions";

const MIN_QUERY_LENGTH = 3;

export type ExploreSelectedLocation = {
  latitude: number;
  longitude: number;
  label: string;
};

type Props = {
  onSelectLocation: (location: ExploreSelectedLocation) => void;
  locationLabel?: string;
  /** Right-hand target icon (Figma): re-locate to the device position. */
  onUseCurrentLocation?: () => void;
};

export const ExploreLocationSearchBar: React.FC<Props> = ({
  onSelectLocation,
  locationLabel = "",
  onUseCurrentLocation,
}) => {
  const theme = useTheme();
  const isDark = useIsDark();
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState(locationLabel);
  const selectedLabelRef = useRef(locationLabel);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { suggestions, isLoading, error, cancel } = useLocationSuggestions(
    query,
    isFocused && query !== selectedLabel
  );
  useEffect(() => {
    cancel();
    setQuery(locationLabel);
    setSelectedLabel(locationLabel);
    selectedLabelRef.current = locationLabel;
  }, [locationLabel, cancel]);
  useEffect(
    () => () => {
      if (blurTimer.current) clearTimeout(blurTimer.current);
    },
    []
  );

  const handleSelect = useCallback(
    (item: GeocodingSearchResult) => {
      if (blurTimer.current) clearTimeout(blurTimer.current);
      cancel();
      Keyboard.dismiss();
      setQuery(item.name);
      setSelectedLabel(item.name);
      selectedLabelRef.current = item.name;
      // Dismissing the keyboard can schedule onBlur with the previous label.
      if (blurTimer.current) clearTimeout(blurTimer.current);
      setIsFocused(false);
      onSelectLocation({
        latitude: item.location.latitude,
        longitude: item.location.longitude,
        label: item.name,
      });
    },
    [onSelectLocation, cancel]
  );

  const handleClear = useCallback(() => {
    cancel();
    setQuery("");
    setSelectedLabel("");
    selectedLabelRef.current = "";
  }, [cancel]);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<GeocodingSearchResult>) => (
      <TouchableOpacity
        style={[styles.item, { borderBottomColor: theme.colors.border0 }]}
        accessibilityRole="button"
        accessibilityLabel={`Select ${item.name}`}
        onPress={() => handleSelect(item)}
        activeOpacity={0.7}
      >
        <Text
          variant="body"
          size="medium"
          numberOfLines={1}
          style={{ color: theme.colors.textPrimary }}
        >
          {item.name}
        </Text>
      </TouchableOpacity>
    ),
    [handleSelect, theme.colors]
  );

  const showDropdown =
    isFocused &&
    query !== selectedLabel &&
    query.trim().length >= MIN_QUERY_LENGTH;

  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.inputRow,
          {
            // Figma: Textfield Surface/Secondary + Border-0 (dark #091421 / #333).
            backgroundColor: isDark ? "#091421" : theme.colors.surfacePrimary,
            borderColor: theme.colors.border0,
          },
        ]}
      >
        {isDark ? (
          <ExploreLocationSearchIconDark width={24} height={24} />
        ) : (
          <ExploreLocationSearchIcon width={24} height={24} />
        )}
        <TextInput
          style={[styles.input, { color: theme.colors.textPrimary }]}
          placeholder={EXPLORE_COPY.enterLocation}
          placeholderTextColor={theme.colors.textTertiary}
          value={query}
          selectTextOnFocus
          accessibilityLabel={EXPLORE_COPY.searchLocation}
          onChangeText={(value) => {
            cancel();
            setQuery(value);
          }}
          onFocus={() => {
            if (blurTimer.current) clearTimeout(blurTimer.current);
            setIsFocused(true);
            // selectTextOnFocus alone is unreliable on Android (doesn't
            // always re-select on tap, especially after the field has
            // already been focused once) — clear explicitly instead so
            // tapping the prefilled "Current Location" value always lets
            // you type a fresh search immediately.
            setQuery((current) => (current === selectedLabel ? "" : current));
          }}
          onBlur={() => {
            blurTimer.current = setTimeout(() => {
              setIsFocused(false);
              // Nothing was picked from the dropdown — restore the
              // previously selected label instead of leaving the field
              // blank or showing abandoned typed text.
              setQuery(selectedLabelRef.current);
            }, 150);
          }}
        />
        {isFocused && query.length > 0 ? (
          // While typing: clear the typed text.
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={EXPLORE_COPY.clearSearch}
            onPress={handleClear}
            hitSlop={8}
          >
            <MaterialIcons
              name="close"
              size={18}
              color={theme.colors.textTertiary}
            />
          </TouchableOpacity>
        ) : onUseCurrentLocation ? (
          // Figma 9376:267165 target-03 (24px): jump back to the device location.
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={EXPLORE_COPY.recenter}
            onPress={onUseCurrentLocation}
            hitSlop={8}
          >
            {isDark ? (
              <ExploreSearchTargetIconDark width={24} height={24} />
            ) : (
              <ExploreSearchTargetIcon width={24} height={24} />
            )}
          </TouchableOpacity>
        ) : null}
      </View>

      {showDropdown && (
        <View
          style={[
            styles.dropdown,
            {
              backgroundColor: theme.colors.surfacePrimary,
              borderColor: theme.colors.border0,
            },
          ]}
        >
          <FlatList
            data={suggestions}
            renderItem={renderItem}
            keyExtractor={(item) => item.placeId}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <View style={styles.empty}>
                {isLoading && (
                  <ActivityIndicator color={theme.colors.primary} />
                )}
                <Text
                  accessibilityLiveRegion="polite"
                  variant="body"
                  size="small"
                  style={{ color: theme.colors.textTertiary }}
                >
                  {isLoading
                    ? EXPLORE_COPY.searching
                    : error ?? EXPLORE_COPY.noMatches}
                </Text>
              </View>
            }
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
  },
  // Figma Search Bar: 48 high, px16/py12, gap 12, Body/16 Regular.
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: Radius.full ?? 999,
    paddingHorizontal: spacing[4],
    height: 48,
  },
  input: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: 16,
    letterSpacing: -0.16,
    paddingVertical: 0,
  },
  // Overlays the map below instead of pushing the layout down.
  dropdown: {
    position: "absolute",
    top: 56,
    left: 0,
    right: 0,
    zIndex: 20,
    elevation: 20,
    maxHeight: 160,
    borderWidth: 1,
    borderRadius: Radius.md,
    overflow: "hidden",
  },
  item: {
    paddingVertical: 12,
    paddingHorizontal: spacing[4],
    borderBottomWidth: 1,
  },
  empty: {
    padding: spacing[4],
    alignItems: "center",
  },
});
