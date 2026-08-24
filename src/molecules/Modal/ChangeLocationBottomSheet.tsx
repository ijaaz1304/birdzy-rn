import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Keyboard, Platform, Pressable, ScrollView, StyleSheet, TextInput, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { AppSheet } from "../../components/AppSheet/AppSheet";
import { Text } from "../../atoms";
import { useTheme } from "../../hooks/useTheme";
import { MODAL_STRINGS } from "../../config/strings/modals.strings";
import {
  geocodeAddress,
  searchAddressSuggestions,
} from "../../utils/geocodingApi";
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
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const strings = MODAL_STRINGS.bottomSheets.changeLocation;
  const sheetTitle =
    variant === "add" ? strings.addTitle : strings.customTitle;
  const resolvedInitialQuery = sanitizeLocationSearchQuery(initialQuery);
  const inputRef = useRef<TextInput>(null);
  const scrollRef = useRef<ScrollView>(null);
  const [query, setQuery] = useState(resolvedInitialQuery);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [inputFocused, setInputFocused] = useState(false);

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
    const focusTimer = setTimeout(() => {
      inputRef.current?.focus();
    }, 450);
    return () => clearTimeout(focusTimer);
  }, [visible, initialQuery]);

  useEffect(() => {
    if (!visible) return;
    const trimmed = query.trim();
    if (trimmed.length < MIN_SEARCH_CHARS) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await searchAddressSuggestions(trimmed);
        setSuggestions(
          results.map((item) => ({
            placeId: item.placeId,
            name: item.name,
            formattedAddress: item.formattedAddress,
            location: item.location,
          }))
        );
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query, visible]);

  const handleSelectSuggestion = useCallback(
    (item: LocationSuggestion) => {
      if (submitting) return;
      Keyboard.dismiss();
      onConfirm({
        latitude: item.location?.latitude ?? 0,
        longitude: item.location?.longitude ?? 0,
        address: item.formattedAddress || item.name,
      });
      onClose();
    },
    [onClose, onConfirm, submitting]
  );

  const handleManualSubmit = useCallback(async () => {
    if (submitting) return;
    const trimmed = query.trim();
    if (!trimmed) return;

    setSubmitting(true);
    try {
      try {
        const geocoded = await geocodeAddress(trimmed);
        onConfirm({
          latitude: geocoded.latitude,
          longitude: geocoded.longitude,
          address: geocoded.formattedAddress || trimmed,
        });
      } catch {
        onConfirm({
          latitude: 0,
          longitude: 0,
          address: trimmed,
        });
      }
      onClose();
    } finally {
      setSubmitting(false);
    }
  }, [onClose, onConfirm, query, submitting]);

  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  const showSuggestions = query.trim().length > 0 && suggestions.length > 0;
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

      <Text
        variant="label"
        size="small"
        weight="medium"
        style={[styles.fieldLabel, { color: theme.colors.textPrimary }]}
      >
        {strings.customLocationLabel}
      </Text>

      <Pressable
        onPress={focusInput}
        style={[
          styles.inputRow,
          {
            borderColor: theme.colors.borderBrand,
            backgroundColor: theme.colors.surface,
          },
        ]}
      >
        <MaterialIcons
          name="place"
          size={20}
          color={theme.colors.textSecondary}
        />
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
    gap: 12,
    paddingBottom: 8,
  },
  subtitle: {
    lineHeight: 24,
  },
  fieldLabel: {
    marginBottom: 0,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 360,
    paddingHorizontal: 16,
    paddingVertical: 10,
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
