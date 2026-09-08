import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Modal, TouchableWithoutFeedback, FlatList, Animated, PanResponder, Dimensions } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme, useIsDark } from "../../hooks/useTheme";
import { OVERLAY_COLORS } from "../../constants/colorConstants";
import { HIT_SLOP } from "../../constants/uiConstants";
import { FONTS } from "../../common/typography";

import { Radius } from "../../design";

import { spacing } from "../../design-system/spacing";
import { getBottomSheetChromeStyle } from "../../design-system/modalTokens";
import { APP_COLORS } from "../../config/colors";

import {
  FilterModalProps,
  FilterCategory,
  FilterCategoryConfig,
  FilterState,
  FilterData,
} from "./types";
import { MUSHROOM_FILTER_FIELD_LABELS } from "../../constants/mushroomOptions";
/** Default empty filter data when API data is not provided. */
const DEFAULT_FILTER_DATA = { data: { colors: [], locations: [], types: [] } };

/** Format API filter value for display only (e.g. handle_with_care → Handle with care). Send original value to API. */
function formatFilterOptionLabel(apiValue: string): string {
  if (!apiValue || typeof apiValue !== "string") return apiValue;
  return apiValue.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const LEGACY_MINERAL_FILTER_LABELS: Record<string, string> = {
  crystalSystem: "Crystal System",
  lusture: "Lustre",
  transparency: "Transparency",
  chakra: "Chakra",
  color: "Color",
};

/** Figma 8030:20248 — left category rail */
const CATEGORY_PANEL_WIDTH = 127;
const FILTER_SEARCH_HEIGHT = 48;
const FILTER_CHECKBOX_SIZE = 24;
/** Figma brand-1 primary on filter sheet (light) */
const FILTER_ACCENT_LIGHT = APP_COLORS.createButtonFg;
/** Keep catalogue header visible above the sheet (Figma: sheet sits lower, not full-screen) */
const FILTER_MODAL_MIN_TOP_OFFSET = 200;
const FILTER_MODAL_TOP_OFFSET_RATIO = 0.26;

function getFilterModalTopOffset(screenHeight: number): number {
  return Math.max(
    FILTER_MODAL_MIN_TOP_OFFSET,
    Math.round(screenHeight * FILTER_MODAL_TOP_OFFSET_RATIO)
  );
}

const FilterModal = ({
  visible,
  onClose,
  onApplyFilters,
  clearAllFilters,
  defaultFilters = {},
  comingFrom = "Private Collection",
  filterDataFromApi,
}: FilterModalProps) => {
  const theme = useTheme();
  const colors = theme.colors;
  const isDark = useIsDark();
  const filterAccent = isDark ? colors.primaryCTA : FILTER_ACCENT_LIGHT;
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<FilterCategory>("birdType");
  const [isDraggingModal, setIsDraggingModal] = useState(false);

  const modalRef = useRef<View>(null);
  const categoriesListRef = useRef<FlatList<FilterCategoryConfig>>(null);
  const dragHandleRef = useRef<View>(null);
  const translateY = useRef(new Animated.Value(0)).current;
  const backgroundOpacity = useRef(new Animated.Value(1)).current;
  const isDragging = useRef(false);
  const _dragStartY = useRef(0);
  const screenHeight = Dimensions.get("window").height;
  const modalTopOffset = getFilterModalTopOffset(screenHeight);
  const modalHeight = screenHeight - modalTopOffset;
  const DRAG_THRESHOLD = 100; // Minimum drag distance to close modal

  const result = useMemo(
    () =>
      filterDataFromApi && Object.keys(filterDataFromApi).length > 0
        ? { data: filterDataFromApi }
        : DEFAULT_FILTER_DATA,
    [filterDataFromApi]
  );

  const filterCategories = useMemo<FilterCategoryConfig[]>(() => {
    const categoryMap: Record<string, string> = {
      birdType: "Bird Type",
      habitat: "Habitat",
      conservationStatus: "Conservation Status",
      flightPattern: "Flight Pattern",
      flightAltitude: "Flight Altitude",
      diet: "Diet",
      size: "Size",
      customLocation: "Location",
      "birdWatchingTips.bestTime": "Best Time to Watch",
      "birdWatchingTips.preferredLocations": "Preferred Locations",
      scientificClassification: "Scientific Classification",
      ...MUSHROOM_FILTER_FIELD_LABELS,
      ...LEGACY_MINERAL_FILTER_LABELS,
    };

    const data = result?.data;
    if (!data || typeof data !== "object") return [];

    return Object.keys(data)
      .filter((key) => {
        if (key === "commonlyFoundIn") return false;
        const val = data[key as keyof typeof data];
        if (Array.isArray(val)) return val.length > 0;
        if (val && typeof val === "object" && !Array.isArray(val))
          return Object.keys(val).length > 0;
        return false;
      })
      .map((key) => ({
        id: key as FilterCategory,
        label:
          categoryMap[key] ||
          key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()),
      }));
  }, [result]);

  // Initialize filters dynamically based on available categories
  const initialFilters = useMemo<FilterState>(() => {
    const filters: FilterState = {};
    filterCategories.forEach((category) => {
      filters[category.id] = [];
    });
    return filters;
  }, [filterCategories]);

  const [filters, setFilters] = useState<FilterState>(initialFilters);

  // Update filters when categories change
  useEffect(() => {
    setFilters((prev) => {
      const updated = { ...initialFilters };
      // Preserve existing filter values for categories that still exist
      filterCategories.forEach((category) => {
        if (prev[category.id]) {
          updated[category.id] = [...prev[category.id]];
        }
      });
      return updated;
    });
  }, [filterCategories]);

  // When categories come from API, select first category if current is not in list
  useEffect(() => {
    if (
      filterCategories.length > 0 &&
      !filterCategories.some((cat) => cat.id === selectedCategory)
    ) {
      setSelectedCategory(filterCategories[0].id as FilterCategory);
    }
  }, [filterCategories, selectedCategory]);

  // Options memoized based on result data
  const options = useMemo<FilterData>(() => {
    const opts: FilterData = {};
    const data = (result?.data ?? {}) as FilterData;
    filterCategories.forEach((category) => {
      if (category.id === "scientificClassification") {
        opts[category.id] =
          (data[category.id] as Record<string, string[]> | undefined) ?? {};
      } else {
        opts[category.id] = (data[category.id] as string[] | undefined) ?? [];
      }
    });
    return opts;
  }, [result, filterCategories]);

  // Merge default filters when modal becomes visible
  useEffect(() => {
    if (visible && defaultFilters) {
      setFilters((prev) => {
        const mergedFilters = { ...prev };
        Object.keys(defaultFilters).forEach((key) => {
          if (filterCategories.some((cat) => cat.id === key)) {
            mergedFilters[key] = Array.from(
              new Set([...(defaultFilters[key] || []), ...(prev[key] || [])])
            );
          }
        });
        return mergedFilters;
      });
    }
  }, [visible, defaultFilters, filterCategories]);

  const handleToggleOption = useCallback(
    (option: string) => {
      const category = selectedCategory;
      // In global catalogue filters, defaultFilters represent current selection (not locked).
      const isDefault =
        comingFrom !== "global_collection" &&
        defaultFilters[category]?.includes(option);

      if (isDefault) return; // don't allow toggle if it's a default filter

      setFilters((prevFilters) => {
        const currentFilters = prevFilters[category] || [];
        const updated = [...currentFilters];
        const index = updated.indexOf(option);

        if (index > -1) {
          updated.splice(index, 1);
        } else {
          updated.push(option);
        }

        return {
          ...prevFilters,
          [category]: updated,
        };
      });
    },
    [selectedCategory, defaultFilters]
  );

  const clearAllFilters1 = useCallback(() => {
    if (clearAllFilters) {
      clearAllFilters();
    }

    const resetFilters: FilterState = { ...initialFilters };

    // Preserve default filters only for private collection flows
    if (defaultFilters && comingFrom !== "global_collection") {
      Object.keys(defaultFilters).forEach((key) => {
        const val = defaultFilters[key];
        if (
          Array.isArray(val) &&
          filterCategories.some((cat) => cat.id === key)
        ) {
          resetFilters[key] = [...val];
        }
      });
    }

    setFilters(resetFilters);
  }, [clearAllFilters, defaultFilters, initialFilters, filterCategories]);

  const getTotalSelectedCount = useCallback((): number => {
    return Object.values(filters).reduce(
      (total, filterArray) => total + (filterArray?.length ?? 0),
      0
    );
  }, [filters]);

  const filteredOptions = useMemo(() => {
    if (selectedCategory === "scientificClassification") {
      const classificationData =
        (options[selectedCategory] as Record<string, string[]>) || {};
      // Flatten scientific classification into a list of { level, value } pairs
      const flattened: Array<{ level: string; value: string }> = [];
      Object.keys(classificationData).forEach((level) => {
        const values = classificationData[level] || [];
        values.forEach((value) => {
          flattened.push({ level, value });
        });
      });
      if (!searchText.trim()) {
        return flattened;
      }
      const searchLower = searchText.toLowerCase();
      return flattened.filter(
        (item) =>
          item.level.toLowerCase().includes(searchLower) ||
          item.value.toLowerCase().includes(searchLower)
      );
    }
    const categoryOptions = (options[selectedCategory] as string[]) || [];
    if (!searchText.trim()) {
      return categoryOptions;
    }
    const searchLower = searchText.toLowerCase();
    return categoryOptions.filter((option) =>
      String(option).toLowerCase().includes(searchLower)
    );
  }, [options, selectedCategory, searchText]);

  const Checkbox = useCallback(
    ({
      checked,
      onPress,
      disabled = false,
    }: {
      checked: boolean;
      onPress: () => void;
      disabled?: boolean;
    }) => (
      <TouchableOpacity
        onPress={disabled ? undefined : onPress}
        style={[
          styles.checkbox(colors),
          checked && styles.checkboxChecked(colors.primaryCTA),
          disabled && { opacity: 0.5 },
        ]}
        disabled={disabled}
      >
        {checked && (
          <Ionicons name="checkmark-sharp" size={16} color={colors.onPrimary} />
        )}
      </TouchableOpacity>
    ),
    [colors]
  );

  // PanResponder for drag gesture - attached only to drag handle
  const dragHandlePanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (evt, gestureState) => {
          // Respond to downward vertical drags
          return Math.abs(gestureState.dy) > 5 && gestureState.dy > 0;
        },
        onPanResponderGrant: () => {
          isDragging.current = true;
          setIsDraggingModal(true);
          translateY.stopAnimation();
        },
        onPanResponderMove: (evt, gestureState) => {
          if (!isDragging.current) return;

          // Only allow downward drags
          if (gestureState.dy > 0) {
            translateY.setValue(gestureState.dy);
            // Animate background opacity based on drag distance
            const maxDrag = screenHeight * 0.5; // Fade out over half screen
            const opacity = Math.max(0, 1 - gestureState.dy / maxDrag);
            backgroundOpacity.setValue(opacity);
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          isDragging.current = false;
          setIsDraggingModal(false);

          if (gestureState.dy > DRAG_THRESHOLD) {
            // Close modal if dragged down enough
            Animated.parallel([
              Animated.timing(translateY, {
                toValue: screenHeight,
                duration: 200,
                useNativeDriver: true,
              }),
              Animated.timing(backgroundOpacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
              }),
            ]).start(() => {
              // Reset values before closing to prevent flash
              translateY.setValue(0);
              backgroundOpacity.setValue(1);
              // Use requestAnimationFrame to ensure state is updated before modal closes
              requestAnimationFrame(() => {
                onClose();
              });
            });
          } else {
            // Snap back to original position
            Animated.parallel([
              Animated.spring(translateY, {
                toValue: 0,
                tension: 100,
                friction: 8,
                useNativeDriver: true,
              }),
              Animated.spring(backgroundOpacity, {
                toValue: 1,
                tension: 100,
                friction: 8,
                useNativeDriver: true,
              }),
            ]).start();
          }
        },
        onPanResponderTerminate: () => {
          isDragging.current = false;
          setIsDraggingModal(false);
          Animated.parallel([
            Animated.spring(translateY, {
              toValue: 0,
              tension: 100,
              friction: 8,
              useNativeDriver: true,
            }),
            Animated.spring(backgroundOpacity, {
              toValue: 0.5,
              tension: 100,
              friction: 8,
              useNativeDriver: true,
            }),
          ]).start();
        },
      }),
    [onClose, screenHeight]
  );

  // Reset animation and selected category when modal opens
  useEffect(() => {
    if (visible) {
      // Reset values immediately when modal becomes visible
      translateY.setValue(0);
      backgroundOpacity.setValue(1);
      // Reset to first available category
      if (
        filterCategories.length > 0 &&
        !filterCategories.some((cat) => cat.id === selectedCategory)
      ) {
        setSelectedCategory(filterCategories[0].id);
      }
      setSearchText("");
    }
  }, [visible, filterCategories, selectedCategory]);

  // Keep the active left-rail category visible when the list is long.
  useEffect(() => {
    if (!visible || filterCategories.length === 0) return;
    const index = filterCategories.findIndex(
      (category) => category.id === selectedCategory
    );
    if (index < 0) return;
    requestAnimationFrame(() => {
      categoriesListRef.current?.scrollToIndex({
        index,
        animated: true,
        viewPosition: 0.5,
      });
    });
  }, [visible, selectedCategory, filterCategories]);

  return (
    <Modal
      animationType="none"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent={true}
      presentationStyle="overFullScreen"
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={[styles.container, { zIndex: 9998, elevation: 9998 }]}>
          <Animated.View
            style={[
              styles.background,
              {
                opacity: backgroundOpacity,
              },
            ]}
          />

          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <Animated.View
              style={[
                styles.modalContent(colors, modalHeight),
                getBottomSheetChromeStyle(theme),
                {
                  transform: [{ translateY: translateY }],
                },
              ]}
              ref={modalRef}
            >
              {/* Drag Handle - Make it interactive - ONLY attach panHandlers here */}
              <View
                ref={dragHandleRef}
                style={styles.dragHandleContainer}
                {...dragHandlePanResponder.panHandlers}
              >
                <View style={styles.placeholder(colors)} />
              </View>

              <View style={styles.header}>
                <TouchableOpacity
                  onPress={clearAllFilters1}
                  style={styles.headerLeft}
                  hitSlop={HIT_SLOP.CLOSE}
                >
                  <Text
                    numberOfLines={1}
                    style={styles.headerClearAllText(filterAccent)}
                  >
                    Clear all
                  </Text>
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                  <Text style={styles.headerTitle(colors)}>Filter</Text>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.headerRight}
                  hitSlop={HIT_SLOP.CLOSE}
                >
                  <View style={styles.closeButton(colors)}>
                    <Ionicons
                      name="close"
                      size={20}
                      color={colors.textPrimary || colors.text}
                    />
                  </View>
                </TouchableOpacity>
              </View>

              <View style={styles.content}>
                <View style={styles.categoriesContainer(colors)}>
                  <FlatList
                    ref={categoriesListRef}
                    style={styles.categoriesList}
                    data={filterCategories}
                    keyExtractor={(item) => item.id}
                    showsVerticalScrollIndicator={
                      filterCategories.length > 8
                    }
                    nestedScrollEnabled
                    scrollEnabled={!isDraggingModal}
                    onScrollToIndexFailed={({ index }) => {
                      setTimeout(() => {
                        categoriesListRef.current?.scrollToIndex({
                          index,
                          animated: false,
                          viewPosition: 0.5,
                        });
                      }, 100);
                    }}
                    renderItem={({ item: category }) => {
                      const selected = selectedCategory === category.id;
                      const selectedCount = filters[category.id]?.length ?? 0;
                      return (
                        <TouchableOpacity
                          key={category.id}
                          style={[
                            styles.categoryItem,
                            selected && styles.selectedCategory(colors, filterAccent),
                          ]}
                          onPress={() => {
                            setSelectedCategory(category.id as FilterCategory);
                            setSearchText("");
                          }}
                        >
                          <Text
                            style={[
                              selected
                                ? styles.categoryTextSelected(colors)
                                : styles.categoryTextUnselected(colors),
                            ]}
                          >
                            {category.label}
                            {selectedCount > 0 && ` (${selectedCount})`}
                          </Text>
                        </TouchableOpacity>
                      );
                    }}
                    initialNumToRender={12}
                    maxToRenderPerBatch={20}
                    windowSize={5}
                  />
                </View>

                <View style={styles.optionsContainer}>
                  <View style={styles.searchBox(colors)}>
                    <Ionicons
                      name="search"
                      size={24}
                      color={colors.textTertiary}
                    />
                    <TextInput
                      style={styles.searchInput(colors)}
                      placeholderTextColor={colors.textTertiary}
                      cursorColor={filterAccent}
                      placeholder="Search"
                      value={searchText}
                      onChangeText={setSearchText}
                    />
                  </View>

                  <FlatList<string | { level: string; value: string }>
                    style={styles.optionsList}
                    data={filteredOptions}
                    keyExtractor={(item, index) =>
                      selectedCategory === "scientificClassification"
                        ? `${(item as { level: string; value: string }).level}-${(item as { level: string; value: string }).value}`
                        : `${String(item)}-${index}`
                    }
                    showsVerticalScrollIndicator={false}
                    scrollEnabled={!isDraggingModal}
                    renderItem={({ item: option }) => {
                      // Handle scientific classification which is an object
                      const optionValue =
                        selectedCategory === "scientificClassification"
                          ? (option as any).value
                          : String(option);
                      const optionLabel =
                        selectedCategory === "scientificClassification"
                          ? `${
                              (option as any).level
                            }: ${formatFilterOptionLabel(
                              (option as any).value
                            )}`
                          : formatFilterOptionLabel(optionValue);

                      const isDefault =
                        comingFrom !== "global_collection" &&
                        defaultFilters[selectedCategory]?.includes(optionValue);
                      const isChecked =
                        filters[selectedCategory]?.includes(optionValue) ??
                        false;

                      return (
                        <TouchableOpacity
                          style={styles.optionItemContainer}
                          onPress={() =>
                            !isDefault && handleToggleOption(optionValue)
                          }
                          disabled={isDefault}
                        >
                          <View style={styles.optionItem}>
                            <View style={styles.checkboxContainer}>
                              <Checkbox
                                checked={isChecked}
                                onPress={() =>
                                  !isDefault && handleToggleOption(optionValue)
                                }
                                disabled={isDefault}
                              />
                            </View>
                            <Text style={styles.optionText(colors)}>
                              {optionLabel}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    }}
                    initialNumToRender={12}
                    maxToRenderPerBatch={20}
                    windowSize={5}
                  />
                </View>
              </View>

              <SafeAreaView edges={["bottom"]} style={styles.footer}>
                <TouchableOpacity
                  style={styles.applyButton(colors.primaryCTA)}
                  onPress={() =>
                    onApplyFilters(filters, getTotalSelectedCount() > 0)
                  }
                >
                  <Text style={styles.applyButtonText(colors)}>
                    See results
                    {getTotalSelectedCount() > 0 &&
                      ` (${getTotalSelectedCount()})`}
                  </Text>
                </TouchableOpacity>
              </SafeAreaView>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = {
  container: StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "flex-end",
    },
  }).container,
  background: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: OVERLAY_COLORS.MODAL_BACKDROP,
  },
  modalContent: (colors: any, height: number) => ({
    height,
    backgroundColor: colors.surfacePrimary || colors.background,
    width: "100%" as const,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: "hidden" as const,
  }),
  header: StyleSheet.create({
    header: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "space-between" as const,
      paddingHorizontal: spacing[5],
      paddingTop: spacing[5],
      paddingBottom: spacing[4],
      gap: spacing[4],
    },
  }).header,
  headerLeft: StyleSheet.create({
    headerLeft: {
      flexShrink: 0,
      paddingVertical: 4,
      paddingRight: spacing[2],
      alignItems: "flex-start" as const,
      justifyContent: "center" as const,
    },
  }).headerLeft,
  headerClearAllText: (accent: string) => ({
    fontSize: 14,
    lineHeight: 20,
    fontFamily: FONTS.medium,
    color: accent,
    flexShrink: 0,
  }),
  headerCenter: {
    flex: 1,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  headerTitle: (colors: any) => ({
    fontSize: 16,
    lineHeight: 24,
    fontFamily: FONTS.medium,
    color: colors.textPrimary || colors.text,
  }),
  headerRight: {
    width: 52,
    alignItems: "flex-end" as const,
    justifyContent: "center" as const,
  },
  closeButton: (colors: any) => ({
    width: 32,
    height: 32,
    borderRadius: 24,
    backgroundColor: colors.surfaceSecondary,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  }),
  placeholder: (colors: any) => ({
    position: "relative" as const,
    top: 0,
    left: 0,
    width: 50,
    borderBottomWidth: 6,
    borderBottomColor: colors.borderLight || colors.border,
    borderRadius: Radius.md,
  }),
  searchBox: (colors: any) => ({
    flexDirection: "row" as const,
    alignItems: "center" as const,
    backgroundColor: colors.surfacePrimary || colors.background,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border0 || colors.borderLight || colors.border,
    paddingHorizontal: spacing[4],
    height: FILTER_SEARCH_HEIGHT,
    marginBottom: spacing[2],
  }),
  searchInput: (colors: any) => ({
    flex: 1,
    marginLeft: spacing[3],
    fontSize: 16,
    lineHeight: 24,
    paddingVertical: 0,
    color: colors.textPrimary || colors.text,
    fontFamily: FONTS.regular,
  }),
  content: StyleSheet.create({
    content: {
      flex: 1,
      flexDirection: "row" as const,
      paddingHorizontal: spacing[5],
      gap: spacing[4],
      minHeight: 0,
    },
  }).content,
  categoriesContainer: (colors: any) => ({
    width: CATEGORY_PANEL_WIDTH,
    alignSelf: "stretch" as const,
    minHeight: 0,
    backgroundColor: colors.surfacePrimary,
    borderRightWidth: 1,
    borderRightColor: colors.border0 || colors.border,
    borderTopLeftRadius: Radius.md,
    borderBottomLeftRadius: Radius.md,
    overflow: "hidden" as const,
  }),
  categoriesList: StyleSheet.create({
    categoriesList: {
      flex: 1,
    },
  }).categoriesList,
  categoryItem: StyleSheet.create({
    categoryItem: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "flex-start" as const,
      paddingVertical: spacing[2],
      paddingHorizontal: spacing[2],
    },
  }).categoryItem,
  selectedCategory: (colors: any, accent: string) => ({
    backgroundColor: colors.surfaceSecondary,
    borderRightWidth: 2,
    borderRightColor: accent,
  }),
  categoryTextSelected: (colors: any) => ({
    fontSize: 14,
    lineHeight: 20,
    color: colors.textPrimary || colors.text,
    fontFamily: FONTS.medium,
  }),
  categoryTextUnselected: (colors: any) => ({
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    fontFamily: FONTS.regular,
  }),
  optionsContainer: StyleSheet.create({
    optionsContainer: {
      flex: 1,
      minWidth: 0,
      minHeight: 0,
    },
  }).optionsContainer,
  optionsList: StyleSheet.create({
    optionsList: {
      flex: 1,
    },
  }).optionsList,
  optionItemContainer: StyleSheet.create({
    optionItemContainer: {
      width: "100%" as const,
    },
  }).optionItemContainer,
  optionItem: StyleSheet.create({
    optionItem: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      paddingVertical: spacing[1],
      paddingHorizontal: spacing[2],
      minHeight: 32,
    },
  }).optionItem,
  checkboxContainer: StyleSheet.create({
    checkboxContainer: {
      marginRight: spacing[3],
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
  }).checkboxContainer,
  optionText: (colors: any) => ({
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: colors.textPrimary || colors.text,
    fontFamily: FONTS.regular,
  }),
  checkbox: (colors: any) => ({
    width: FILTER_CHECKBOX_SIZE,
    height: FILTER_CHECKBOX_SIZE,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.border0 || colors.border,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  }),
  checkboxChecked: (accent: string) => ({
    borderColor: accent,
    backgroundColor: accent,
  }),
  footer: StyleSheet.create({
    footer: {
      paddingHorizontal: spacing[5],
      paddingTop: spacing[4],
      paddingBottom: spacing[2],
    },
  }).footer,
  applyButton: (accent: string) => ({
    backgroundColor: accent,
    borderRadius: 24,
    height: 44,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  }),
  applyButtonText: (colors: any) => ({
    color: colors.onPrimary,
    fontSize: 16,
    lineHeight: 24,
    fontFamily: FONTS.medium,
  }),
  dragHandleContainer: StyleSheet.create({
    dragHandleContainer: {
      paddingTop: spacing[2],
      paddingBottom: spacing[1],
      alignItems: "center" as const,
      justifyContent: "center" as const,
      width: "100%",
    },
  }).dragHandleContainer,
};

export default FilterModal;
