/**
 * Dropdown of local hybrid (prefix + light fuzzy) suggestions from new_mushroom_search.json.
 * Updates as user types with 250ms debounce; no API until they tap a suggestion (onSelect).
 * Selection via requestAnimationFrame to avoid blur-before-tap.
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Text } from "../atoms";
import { useTheme } from "../hooks/useTheme";
import { Radius } from "../design";

import { spacing } from "../design-system/spacing";

import {
  searchBirdsHybrid,
  getSearchSuggestionLabel,
  getSearchSuggestionSubtitle,
  type SearchDataItem,
} from "../services/localSearch";

const DEBOUNCE_MS = 250;

export interface SearchSuggestionsProps {
  query: string;
  visible: boolean;
  onSelect: (item: SearchDataItem) => void;
  /** Max dropdown height; defaults to 300. */
  maxHeight?: number;
  /** Keeps the dropdown open while the user scrolls (cancels pending blur-hide). */
  onInteractionStart?: () => void;
}

export const SearchSuggestions = React.memo<SearchSuggestionsProps>(
  function SearchSuggestions({
    query,
    visible,
    onSelect,
    maxHeight = DROPDOWN_HEIGHT,
    onInteractionStart,
  }) {
    const theme = useTheme();
    const [suggestions, setSuggestions] = useState<SearchDataItem[]>([]);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
      if (!visible) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        debounceRef.current = null;
        const results = searchBirdsHybrid(query.trim(), 15);
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

    const renderSuggestionRow = useCallback(
      (item: SearchDataItem) => {
        const label = getSearchSuggestionLabel(item);
        const subtitle = getSearchSuggestionSubtitle(item);
        return (
          <TouchableOpacity
            key={item.canonicalName}
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

    if (!visible) return null;

    return (
      <View
        style={[
          styles.dropdown,
          {
            maxHeight,
            backgroundColor: theme.colors.surfacePrimary,
            borderColor: theme.colors.border0,
          },
        ]}
        onTouchStart={onInteractionStart}
      >
        <ScrollView
          style={[styles.list, { maxHeight }]}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="always"
          nestedScrollEnabled
          showsVerticalScrollIndicator
          bounces={false}
          onScrollBeginDrag={onInteractionStart}
        >
          {suggestions.length > 0 ? (
            suggestions.map(renderSuggestionRow)
          ) : query.trim().length >= 1 ? (
            <View style={styles.empty}>
              <Text
                variant="caption"
                style={{ color: theme.colors.textTertiary }}
              >
                No suggestions
              </Text>
            </View>
          ) : null}
        </ScrollView>
      </View>
    );
  }
);

const DROPDOWN_HEIGHT = 300;

const styles = StyleSheet.create({
  dropdown: {
    borderWidth: 1,
    borderRadius: Radius.md,
    overflow: "hidden",
  },
  list: {
    flexGrow: 0,
  },
  listContent: {
    flexGrow: 0,
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
