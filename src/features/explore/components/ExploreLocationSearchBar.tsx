import { EXPLORE_COLORS } from "../content/explore.colors";
import { EXPLORE_COPY } from "../content/explore.strings";
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
};

export const ExploreLocationSearchBar: React.FC<Props> = ({
  onSelectLocation,
  locationLabel = "",
}) => {
  const theme = useTheme();
  const isDark = useIsDark();
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState(locationLabel);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { suggestions, isLoading, error, cancel } = useLocationSuggestions(
    query,
    isFocused && query !== selectedLabel
  );
  useEffect(() => {
    cancel();
    setQuery(locationLabel);
    setSelectedLabel(locationLabel);
  }, [locationLabel, cancel]);
  useEffect(
    () => () => {
      if (blurTimer.current) clearTimeout(blurTimer.current);
    },
    []
  );

  const handleSelect = useCallback(
    (item: GeocodingSearchResult) => {
      cancel();
      Keyboard.dismiss();
      setQuery(item.name);
      setSelectedLabel(item.name);
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
            backgroundColor: theme.colors.surfacePrimary,
            borderColor: EXPLORE_COLORS.searchBorder,
          },
        ]}
      >
        {isDark ? (
          <ExploreLocationSearchIconDark width={20} height={20} />
        ) : (
          <ExploreLocationSearchIcon width={20} height={20} />
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
              setQuery(selectedLabel);
            }, 150);
          }}
        />
        {query.length > 0 && (
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
        )}
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
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: Radius.full ?? 999,
    paddingHorizontal: spacing[4],
    height: 44,
  },
  input: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  dropdown: {
    marginTop: 8,
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
