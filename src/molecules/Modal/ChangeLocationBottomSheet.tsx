import { useSheetPreview } from "../../components/AppSheet/SheetPreviewContext";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppSheet } from "../../components/AppSheet/AppSheet";
import { Text } from "../../atoms";
import { useTheme } from "../../hooks/useTheme";
import { MODAL_STRINGS } from "../../config/strings/modals.strings";
import { FONTS } from "../../common/typography";
import { LocationPinpointIcon, LocationRecentIcon } from "../../assets";
import {
  type RecentCustomLocation,
  useRecentCustomLocationsStore,
} from "../../features/location/recentCustomLocations.store";
// Explore's search falls back to Mapbox when GEOCODING_API_KEY is blank; the
// older src/utils copy returned nothing in that case, so no suggestions showed.
import {
  geocodeAddress,
  searchAddressSuggestions,
} from "../../features/explore/utils/geocodingApi";
import type { ChangeLocationSheetVariant } from "../../features/camera/locationToggle.helpers";
import type { IdentificationLocation } from "../../features/camera/identificationLocation.store";
import { sanitizeLocationSearchQuery } from "../../features/camera/locationQuery.helpers";

export interface ChangeLocationBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (location: IdentificationLocation) => void;
  initialQuery?: string;
  /** `add` when no location yet; `custom` when editing an existing location. */
  variant?: ChangeLocationSheetVariant;
}

/** Default height when keyboard is hidden. Grows to fill space above keyboard when open. */
const BASE_SHEET_HEIGHT_RATIO = 0.58;
const MAX_SHEET_HEIGHT_RATIO = 0.9;
const MIN_SHEET_HEIGHT = 280;
const SEARCH_DEBOUNCE_MS = 300;
const MIN_SEARCH_CHARS = 3;

type LocationSuggestion = {
  placeId: string;
  name: string;
  formattedAddress: string;
  location?: {
    latitude: number;
    longitude: number;
  };
};

export const ChangeLocationBottomSheet: React.FC<
  ChangeLocationBottomSheetProps
> = ({
  visible,
  onClose,
  onConfirm,
  initialQuery = "",
  variant = "custom",
}) => {
  const theme = useTheme();
  const preview = useSheetPreview();
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const strings = MODAL_STRINGS.bottomSheets.changeLocation;
  const sheetTitle = variant === "add" ? strings.addTitle : strings.customTitle;
  const resolvedInitialQuery = sanitizeLocationSearchQuery(initialQuery);
  const inputRef = useRef<TextInput>(null);
  const scrollRef = useRef<ScrollView>(null);
  const [query, setQuery] = useState(resolvedInitialQuery);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [inputFocused, setInputFocused] = useState(false);
  /** Outcome of the last finished search, tied to the query it answered. */
  const [searchOutcome, setSearchOutcome] = useState<{
    query: string;
    status: "results" | "empty" | "error";
  } | null>(null);
  const recentLocations = useRecentCustomLocationsStore(
    (state) => state.recent
  );
  const rememberLocation = useRecentCustomLocationsStore(
    (state) => state.remember
  );

  /** Every place chosen here is offered again under "Recently Used". */
  const confirm = useCallback(
    (location: IdentificationLocation) => {
      rememberLocation({
        label: location.address,
        latitude: location.latitude,
        longitude: location.longitude,
      });
      onConfirm(location);
    },
    [onConfirm, rememberLocation]
  );

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (!visible) {
      setKeyboardHeight(0);
      setInputFocused(false);
      return;
    }
    setQuery(sanitizeLocationSearchQuery(initialQuery));
    setSuggestions([]);
    setSearchOutcome(null);
    const focusTimer = setTimeout(() => {
      inputRef.current?.focus();
    }, 450);
    return () => clearTimeout(focusTimer);
  }, [visible, initialQuery]);

  useEffect(() => {
    if (!visible || preview) {
      setLoading(false);
      return;
    }
    const trimmed = query.trim();
    if (trimmed.length < MIN_SEARCH_CHARS) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    // A newer query cancels the older request so stale results never replace it.
    const request = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        // throwOnError separates "nothing matched" from "search failed".
        const results = await searchAddressSuggestions(trimmed, {
          signal: request.signal,
          throwOnError: true,
        });
        if (request.signal.aborted) return;
        setSuggestions(
          results.map((item) => ({
            placeId: item.placeId,
            name: item.name,
            formattedAddress: item.formattedAddress,
            location: item.location,
          }))
        );
        setSearchOutcome({
          query: trimmed,
          status: results.length ? "results" : "empty",
        });
      } catch {
        if (request.signal.aborted) return;
        setSuggestions([]);
        setSearchOutcome({ query: trimmed, status: "error" });
      } finally {
        if (!request.signal.aborted) setLoading(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      request.abort();
    };
  }, [query, visible, preview]);

  const handleSelectSuggestion = useCallback(
    (item: LocationSuggestion) => {
      if (submitting) return;
      Keyboard.dismiss();
      confirm({
        latitude: item.location?.latitude ?? 0,
        longitude: item.location?.longitude ?? 0,
        address: item.formattedAddress || item.name,
      });
      onClose();
    },
    [onClose, confirm, submitting]
  );

  const handleSelectRecent = useCallback(
    (item: RecentCustomLocation) => {
      if (submitting) return;
      Keyboard.dismiss();
      confirm({
        latitude: item.latitude,
        longitude: item.longitude,
        address: item.label,
      });
      onClose();
    },
    [onClose, confirm, submitting]
  );

  const handleManualSubmit = useCallback(async () => {
    if (preview) {
      onClose();
      return;
    }
    if (submitting) return;
    const trimmed = query.trim();
    if (!trimmed) return;

    setSubmitting(true);
    try {
      try {
        const geocoded = await geocodeAddress(trimmed);
        confirm({
          latitude: geocoded.latitude,
          longitude: geocoded.longitude,
          address: geocoded.formattedAddress || trimmed,
        });
      } catch {
        // Unresolved (0,0) places are passed on but not saved as recent.
        confirm({
          latitude: 0,
          longitude: 0,
          address: trimmed,
        });
      }
      onClose();
    } finally {
      setSubmitting(false);
    }
  }, [onClose, confirm, query, submitting, preview]);

  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  const showSuggestions = query.trim().length > 0 && suggestions.length > 0;
  // Only for the query on screen, once its search has finished.
  const answered =
    !loading &&
    query.trim().length >= MIN_SEARCH_CHARS &&
    searchOutcome?.query === query.trim();
  const searchMessage =
    answered && searchOutcome?.status === "empty"
      ? strings.noLocationFound
      : answered && searchOutcome?.status === "error"
      ? strings.searchFailed
      : null;
  // Figma 9376:274415: the not-found row replaces "Recently Used".
  const showRecent =
    !showSuggestions && !searchMessage && recentLocations.length > 0;
  const iconColor = theme.colors.textSecondary;
  const blockDismiss = keyboardHeight > 0 || inputFocused;

  /** Expand sheet upward so the location field stays above the keyboard. */
  const computedSheetHeight = useMemo(() => {
    const topGap = Math.max(insets.top, 8);
    const baseHeight = windowHeight * BASE_SHEET_HEIGHT_RATIO;

    if (keyboardHeight <= 0) return baseHeight;

    const availableHeight = windowHeight - keyboardHeight - topGap;
    return Math.max(
      MIN_SHEET_HEIGHT,
      Math.min(windowHeight * MAX_SHEET_HEIGHT_RATIO, availableHeight)
    );
  }, [keyboardHeight, windowHeight, insets.top]);

  const content = (
    <ScrollView
      ref={scrollRef}
      style={styles.contentRoot}
      contentContainerStyle={styles.contentScroll}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      showsVerticalScrollIndicator={false}
      bounces={false}
      nestedScrollEnabled
    >
      <Text
        variant="body"
        size="medium"
        color="textSecondary"
        style={styles.subtitle}
      >
        {strings.subtitle}
      </Text>

      {/* Figma 9376:274362: Body/14 label 8 above a 360-radius field. */}
      <View style={styles.section}>
        <Text
          style={[styles.sectionLabel, { color: theme.colors.textPrimary }]}
        >
          {variant === "add"
            ? strings.addLocationLabel
            : strings.customLocationLabel}
        </Text>

        <Pressable
          onPress={focusInput}
          style={[
            styles.inputRow,
            {
              // Figma: Border-0 at rest; brand outline while typing.
              borderColor: inputFocused
                ? theme.colors.borderBrand
                : theme.colors.border0,
              backgroundColor:
                theme.colors.textFieldBackground ?? theme.colors.surface,
            },
          ]}
        >
          <View style={styles.icon20}>
            <LocationPinpointIcon
              width={17.92}
              height={17.92}
              color={iconColor}
            />
          </View>
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={setQuery}
            onFocus={() => {
              setInputFocused(true);
              requestAnimationFrame(() => {
                scrollRef.current?.scrollTo({ y: 72, animated: true });
              });
            }}
            onBlur={() => setInputFocused(false)}
            onSubmitEditing={() => {
              void handleManualSubmit();
            }}
            placeholder={strings.placeholder}
            placeholderTextColor={theme.colors.textTertiary}
            style={[styles.input, { color: theme.colors.textPrimary }]}
            autoCorrect={false}
            autoCapitalize="words"
            returnKeyType="search"
            blurOnSubmit={false}
            editable={!submitting}
          />
          {loading ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : null}
        </Pressable>

        {showSuggestions ? (
          <View
            style={[
              styles.suggestions,
              {
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surface,
              },
            ]}
          >
            {suggestions.map((item) => (
              <TouchableOpacity
                key={item.placeId}
                onPress={() => handleSelectSuggestion(item)}
                style={styles.suggestionRow}
              >
                <Text variant="body" size="medium">
                  {item.formattedAddress || item.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        {/* Figma 9376:274433: one row 8 below the field, p4, Body/16 Regular. */}
        {searchMessage ? (
          <View style={styles.messageRow}>
            <Text
              accessibilityRole="alert"
              accessibilityLiveRegion="polite"
              style={[styles.recentLabel, { color: theme.colors.textPrimary }]}
            >
              {searchMessage}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Figma 9376:274372 "Recently Used": clock 20 + Body/16 rows, p4, 8 apart. */}
      {showRecent ? (
        <View style={styles.section}>
          <Text
            accessibilityRole="header"
            style={[styles.sectionLabel, { color: theme.colors.textPrimary }]}
          >
            {strings.recentlyUsed}
          </Text>
          <View style={styles.recentList}>
            {recentLocations.map((item) => (
              <TouchableOpacity
                key={`${item.label}:${item.latitude},${item.longitude}`}
                accessibilityRole="button"
                accessibilityLabel={item.label}
                disabled={submitting}
                onPress={() => handleSelectRecent(item)}
                style={styles.recentRow}
              >
                <View style={styles.icon20}>
                  <LocationRecentIcon
                    width={17.92}
                    height={17.92}
                    color={iconColor}
                  />
                </View>
                <Text
                  numberOfLines={2}
                  style={[
                    styles.recentLabel,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : null}
    </ScrollView>
  );

  return (
    <AppSheet
      visible={visible}
      onClose={onClose}
      type="custom"
      payload={{
        title: sheetTitle,
        showDefaultHeader: true,
        height: computedSheetHeight,
        keyboardBottomInset: keyboardHeight,
        disableScroll: true,
        enableBackdropDismiss: !blockDismiss,
        enablePanDismiss: false,
        children: content,
      }}
    />
  );
};

const styles = StyleSheet.create({
  contentRoot: {
    flex: 1,
    minHeight: 0,
  },
  contentScroll: {
    flexGrow: 1,
    // Figma: sections 20 apart in the body.
    gap: 20,
    paddingBottom: 8,
  },
  subtitle: {
    lineHeight: 24,
    // Figma header pb16 before the first field (16 = 20 gap − 4).
    marginBottom: -4,
  },
  section: { gap: 8 },
  /** Figma Body/14px/Regular, text-primary. */
  sectionLabel: { fontFamily: FONTS.regular, fontSize: 14, lineHeight: 20 },
  icon20: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  recentList: { gap: 8 },
  messageRow: { padding: 4 },
  recentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 4,
  },
  /** Figma Body/16px/Regular. */
  recentLabel: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: 16,
    lineHeight: 24,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 360,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 48,
  },
  input: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    paddingVertical: Platform.OS === "ios" ? 8 : 4,
    minHeight: 28,
  },
  suggestions: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  suggestionRow: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
});
