/**
 * Dropdown of local hybrid (prefix + light fuzzy) suggestions from new_mushroom_search.json.
 * Updates as user types with 250ms debounce; no API until they tap a suggestion (onSelect).
 * Selection via requestAnimationFrame to avoid blur-before-tap.
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, FlatList, TouchableOpacity, StyleSheet, type ListRenderItemInfo } from "react-native";
import { Text } from "../atoms";
import { useTheme } from "../hooks/useTheme";
import { Radius } from "../design";

import { spacing } from "../design-system/spacing";

import {
  searchMushroomsHybrid,
  getSearchSuggestionLabel,
  getSearchSuggestionSubtitle,
  type SearchDataItem,
} from "../services/localSearch";

const DEBOUNCE_MS = 250;

export interface SearchSuggestionsProps {
  query: string;
  visible: boolean;
  onSelect: (item: SearchDataItem) => void;
}

export const SearchSuggestions = React.memo<SearchSuggestionsProps>(
  function SearchSuggestions({ query, visible, onSelect }) {
    const theme = useTheme();
    const [suggestions, setSuggestions] = useState<SearchDataItem[]>([]);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
      if (!visible) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        debounceRef.current = null;
        const results = searchMushroomsHybrid(query.trim(), 15);
        setSuggestions(Array.isArray(results) ? results : []);
      }, DEBOUNCE_MS);
      return () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
      };
    }, [query, visible]);

    const handleSelect = useCallback(
      (item: SearchDataItem) => {
        requestAnimationFrame(() => {
          onSelect(item);
        });
      },
      [onSelect]
    );

    const renderItem = useCallback(
      ({ item }: ListRenderItemInfo<SearchDataItem>) => {
        const label = getSearchSuggestionLabel(item);
        const subtitle = getSearchSuggestionSubtitle(item);
        return (
          <TouchableOpacity
            style={[styles.item, { borderBottomColor: theme.colors.border0 }]}
            onPress={() => handleSelect(item)}
            activeOpacity={0.7}
          >
            <Text
              variant="body"
              size="medium"
              numberOfLines={1}
              style={{ color: theme.colors.textPrimary }}
            >
              {label}
            </Text>
            {subtitle ? (
              <Text
                variant="caption"
                size="small"
                numberOfLines={1}
                style={{ color: theme.colors.textTertiary, marginTop: 2 }}
              >
                {subtitle}
              </Text>
            ) : null}
          </TouchableOpacity>
        );
      },
      [handleSelect, theme.colors]
    );

    const keyExtractor = useCallback(
      (item: SearchDataItem) => item.canonicalName,
      []
    );

    if (!visible) return null;

    return (
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
          keyExtractor={keyExtractor}
          keyboardShouldPersistTaps="handled"
          removeClippedSubviews
          initialNumToRender={10}
          windowSize={3}
          style={styles.list}
          ListEmptyComponent={
            query.trim().length >= 1 ? (
              <View style={styles.empty}>
                <Text
                  variant="caption"
                  style={{ color: theme.colors.textTertiary }}
                >
                  No suggestions
                </Text>
              </View>
            ) : null
          }
        />
      </View>
    );
  }
);

const DROPDOWN_HEIGHT = 300;

const styles = StyleSheet.create({
  dropdown: {
    height: DROPDOWN_HEIGHT,
    borderWidth: 1,
    borderRadius: Radius.md,
    overflow: "hidden",
  },
  list: {
    flex: 1,
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
