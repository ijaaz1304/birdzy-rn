/**
 * Edit Mushroom Details Screen
 * Mushroom-only editable fields aligned with PATCH /core/specimen/update/:id
 */

import { AppImage } from "@/components/AppImage";
import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";
import { View, ViewStyle, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { showAlert } from "../../../store/alert.store";
import { useToast } from "../../../hooks";
import { useEditMushroomResultStore } from "../editMushroomResult.store";
import { analyticsService } from "../../../services/analytics/analytics.service";
import { EVENTS } from "../../../services/analytics/analytics.events";
import { isSessionExpiryError } from "../../../services/api/errors";
import { LimitReachedBottomSheet } from "../../../molecules/Modal";
import { navigateToSubscriptionMain } from "../../../utils/navigation";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../../hooks/useTheme";
import { Text, NavBackIcon } from "../../../atoms";
import {
  PhotoPickerRow,
  TextArea as BaseTextArea,
  InputField as BaseInputField,
  CustomLocationInput,
  Dropdown,
  MultiSelectDropdown,
} from "../../../molecules";
import { CollectionStackParamList } from "../../../navigation/types";
import { MushroomPhoto } from "../../../types/mushroom-media.types";
import { mushroomSpecimenService } from "../../../services/specimen/mushroomSpecimen.service";
import { archetypeService } from "../../../services/archetype/archetype.service";
import { useAppLogsStore } from "../../app-logs/app-logs.store";
import {
  EDIT_ROCK_SPEC,
  AI_DETAILS_SPEC,
  DEFAULT_COORDINATES,
  SHEET_COLORS,
  SUBSCRIPTION_COLORS,
  SCREEN_COLORS,
} from "../../../constants/colorConstants";
import { HIT_SLOP } from "../../../constants/uiConstants";
import { Images } from "../../../assets";
import { typography } from "../../../design-system/typography";
import { Radius } from "../../../design";
import { spacing } from "../../../design-system/spacing";
import {
  EDIT_BIRD_TABS,
  EDIT_BIRD_SAVE_COLOR,
  EditMushroomTabId,
  EditableMushroomData,
  buildMushroomUpdatePayload,
  buildMushroomSpecimenAddPayload,
  parseEditableMushroomData,
  toDropdownOptions,
} from "../editMushroomDetails.utils";
import { COLLECTION_STRINGS } from "../../../config/strings/collection.strings";
import {
  BIRD_TYPE_LABELS,
  CONSERVATION_STATUS_LABELS,
} from "../../../constants/birdOptions";
import { DIET_FILTER_OPTIONS } from "../../../constants/filterOptions";
import { WIZARD_COLOR_OPTIONS } from "../../discovery/stepByStep.constants";
import { WizardSizePicker } from "../../discovery/components/WizardSizePicker";
import { BirdSoundsSection } from "../components/BirdDetailSections";
import { navigateToSoundIdentify } from "../../../utils/navigation";

type EditBirdDetailsScreenRouteProp = RouteProp<
  CollectionStackParamList,
  "EditBirdDetails"
>;
type EditBirdDetailsScreenNavigationProp = NativeStackNavigationProp<
  CollectionStackParamList,
  "EditBirdDetails"
>;

type FilterOptions = Record<string, string[]>;

const LAYOUT_MARGIN = 20;
const SECTION_GAP = 12;
const MARK_ON_MAP_COLOR = "#c7630c";
const TAB_ACTIVE_COLOR = EDIT_BIRD_SAVE_COLOR;

const SIZE_OPTIONS = COLLECTION_STRINGS.birdDetails.sizeScale.map((label) => ({
  label,
  value: label,
}));

const COLOR_OPTIONS = WIZARD_COLOR_OPTIONS.map((option) => ({
  label: option.id,
  value: option.id,
}));

const DIET_TYPE_OPTIONS = [
  { label: "Omnivore", value: "Omnivore" },
  { label: "Herbivore", value: "Herbivore" },
  { label: "Insectivore", value: "Insectivore" },
  { label: "Carnivore", value: "Carnivore" },
  ...DIET_FILTER_OPTIONS.map((option) => ({
    label: option.label,
    value: option.label,
  })),
];

const TAXONOMY_FIELDS = [
  ["Kingdom", "kingdom"],
  ["Phylum", "phylum"],
  ["Class", "class"],
  ["Order", "order"],
  ["Family", "family"],
  ["Genus", "genus"],
  ["Species", "species"],
] as const;

export const EditBirdDetailsScreen: React.FC = () => {
  const theme = useTheme();
  const colors = theme.colors;
  const navigation = useNavigation<EditBirdDetailsScreenNavigationProp>();
  const route = useRoute<EditBirdDetailsScreenRouteProp>();
  const { showToast } = useToast();
  const setEditResult = useEditMushroomResultStore((s) => s.setEditResult);
  const [showCollectionLimitSheet, setShowCollectionLimitSheet] =
    useState(false);

  const mushroomId = route.params?.mushroomId;
  const specimenId = route.params?.specimenId;
  const paramsInitialData = route.params?.initialData;
  const source = route.params?.source;

  const isDark = theme.mode === "dark";
  const editSpec = isDark ? EDIT_ROCK_SPEC.DARK : EDIT_ROCK_SPEC.LIGHT;
  const detailsSpec = isDark ? AI_DETAILS_SPEC.DARK : AI_DETAILS_SPEC.LIGHT;
  const PAGE_BG = editSpec.PAGE_BG;
  const SURFACE_PRIMARY = isDark ? SHEET_COLORS.DARK : SHEET_COLORS.LIGHT;
  const LABEL_COLOR = colors.textPrimary;
  const INPUT_TEXT = editSpec.INPUT_TEXT;
  const INPUT_BG = isDark ? editSpec.INPUT_BG : SHEET_COLORS.LIGHT;
  const INPUT_BORDER = isDark
    ? editSpec.INPUT_BORDER
    : SCREEN_COLORS.LIGHT.border;

  const inputContainerStyle = {
    backgroundColor: INPUT_BG,
    borderWidth: 1,
    borderColor: INPUT_BORDER,
    borderRadius: Radius.md,
  };
  const inputContainerStyleSingleLine = {
    ...inputContainerStyle,
    borderRadius: 30,
  };
  const inputTextStyle = typography.body.large;

  const inputFieldThemeProps = useMemo(
    () => ({
      labelTextColor: LABEL_COLOR,
      inputStyle: StyleSheet.flatten([
        inputContainerStyleSingleLine,
        { color: INPUT_TEXT },
        inputTextStyle,
      ]) as ViewStyle,
      placeholderTextColor: editSpec.PLACEHOLDER,
    }),
    [
      LABEL_COLOR,
      INPUT_TEXT,
      editSpec.PLACEHOLDER,
      inputContainerStyleSingleLine,
      inputTextStyle,
    ]
  );
  const textAreaThemeProps = useMemo(
    () => ({
      labelTextColor: LABEL_COLOR,
      inputStyle: StyleSheet.flatten([
        inputContainerStyle,
        { color: INPUT_TEXT },
        inputTextStyle,
      ]),
      placeholderTextColor: editSpec.PLACEHOLDER,
    }),
    [
      LABEL_COLOR,
      INPUT_TEXT,
      editSpec.PLACEHOLDER,
      inputContainerStyle,
      inputTextStyle,
    ]
  );
  const dropdownThemeProps = useMemo(
    () => ({
      labelTextColor: LABEL_COLOR,
      buttonBackgroundColor: INPUT_BG,
    }),
    [LABEL_COLOR, INPUT_BG]
  );

  const [initialData, setInitialData] = useState<EditableMushroomData | null>(
    null
  );
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [formData, setFormData] = useState<EditableMushroomData | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({});
  const [activeTab, setActiveTab] = useState<EditMushroomTabId>("overview");

  const editTabs = EDIT_BIRD_TABS;
  const birdStrings = COLLECTION_STRINGS.birdDetails;
  const sectionStrings = birdStrings.sections;

  const scrollViewRef = useRef<ScrollView>(null);
  const sectionYOffsets = useRef<Record<EditMushroomTabId, number>>({
    overview: 0,
    sounds: 0,
    characteristics: 0,
    behavior: 0,
    habitat: 0,
    feeding: 0,
    breeding: 0,
    migration: 0,
  });

  const DEFAULT_LOCATION = DEFAULT_COORDINATES;

  useEffect(() => {
    archetypeService
      .getFilterItems()
      .then((data) => setFilterOptions((data ?? {}) as FilterOptions))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (paramsInitialData) {
      setInitialData(
        parseEditableMushroomData(
          paramsInitialData as Record<string, unknown>,
          mushroomId
        )
      );
      setIsLoadingData(false);
    } else {
      setIsLoadingData(false);
    }
  }, [paramsInitialData, mushroomId]);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      setIsDirty(false);
    }
  }, [initialData]);

  useEffect(() => {
    const y = sectionYOffsets.current[activeTab] ?? 0;
    const timer = setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y, animated: true });
    }, 150);
    return () => clearTimeout(timer);
  }, [activeTab]);

  const updateField = useCallback(
    <K extends keyof EditableMushroomData>(
      field: K,
      value: EditableMushroomData[K]
    ) => {
      setIsDirty(true);
      setFormData((prev) => (prev ? { ...prev, [field]: value } : prev));
    },
    []
  );

  const updateClassification = useCallback(
    (
      field: keyof NonNullable<
        EditableMushroomData["scientificClassification"]
      >,
      value: string
    ) => {
      setIsDirty(true);
      setFormData((prev) =>
        prev
          ? {
              ...prev,
              scientificClassification: {
                ...prev.scientificClassification,
                [field]: value,
              },
            }
          : prev
      );
    },
    []
  );

  const handlePhotosChange = useCallback((photos: MushroomPhoto[]) => {
    setIsDirty(true);
    setFormData((prev) => (prev ? { ...prev, images: photos } : prev));
  }, []);

  const handleSave = useCallback(async () => {
    const log = useAppLogsStore.getState();

    if (!formData || !initialData || !mushroomId) {
      return;
    }

    const isFromCollection = source === "collection";
    const hasExistingSpecimen = !!(
      specimenId ||
      (typeof (initialData as Record<string, unknown> | null)?.id ===
        "string" &&
        (initialData as Record<string, unknown>).id) ||
      (typeof (initialData as Record<string, unknown> | null)?._id ===
        "string" &&
        (initialData as Record<string, unknown>)._id)
    );

    const updatePayload = buildMushroomUpdatePayload(formData);
    const archetypeRaw = (paramsInitialData ?? initialData ?? {}) as Record<
      string,
      unknown
    >;

    const persistAdd = async () => {
      log.info("[EditBirdDetails] calling addSpecimen API", {
        mushroomId,
      });
      const addPayload = buildMushroomSpecimenAddPayload(
        archetypeRaw,
        formData,
        mushroomId
      );
      const added = await mushroomSpecimenService.addSpecimen(addPayload);
      const addedAny = added as unknown as Record<string, unknown>;
      const newSpecimenId =
        (typeof addedAny.id === "string" && addedAny.id) ||
        (typeof addedAny._id === "string" && addedAny._id) ||
        null;

      if (!newSpecimenId) {
        showToast("Failed to save bird", "error");
        return;
      }

      setEditResult({
        specimenId: String(newSpecimenId),
        mushroomId,
        specimenData: added as unknown as Record<string, unknown>,
      });
      showToast("Bird details saved successfully", "success");
      analyticsService.logEvent(EVENTS.bird_edit, {
        mushroom_id: mushroomId,
        source: source ?? "unknown",
      });
      navigation.goBack();
    };

    const persistUpdate = async (idToUpdate: string) => {
      log.info("[EditBirdDetails] calling updateSpecimen API", {
        idToUpdate,
        payloadKeys: Object.keys(updatePayload),
      });
      const updated = await mushroomSpecimenService.updateSpecimen(
        idToUpdate,
        updatePayload as any
      );
      const updatedAny = updated as unknown as Record<string, unknown>;
      const resolvedId =
        (typeof updatedAny.id === "string" && updatedAny.id) ||
        (typeof updatedAny._id === "string" && updatedAny._id) ||
        idToUpdate;
      setEditResult({
        specimenId: String(resolvedId),
        mushroomId: isFromCollection ? undefined : mushroomId,
        specimenData: updated as unknown as Record<string, unknown>,
      });
      showToast("Bird details updated successfully", "success");
      analyticsService.logEvent(EVENTS.bird_edit, {
        mushroom_id: idToUpdate,
        source: source ?? "unknown",
      });
      navigation.goBack();
    };

    try {
      if (isFromCollection) {
        const idToUpdate =
          specimenId ??
          (initialData as Record<string, unknown> | null)?.id ??
          (initialData as Record<string, unknown> | null)?._id ??
          mushroomId;

        await persistUpdate(String(idToUpdate));
        return;
      }

      if (source === "identification" && !hasExistingSpecimen) {
        await persistAdd();
        return;
      }

      const idToUpdate =
        specimenId ??
        (initialData as Record<string, unknown> | null)?.id ??
        (initialData as Record<string, unknown> | null)?._id ??
        null;

      if (!idToUpdate) {
        await persistAdd();
        return;
      }

      await persistUpdate(String(idToUpdate));
    } catch (error: any) {
      log.warn("[EditBirdDetails] save failed", {
        error: error?.message ?? String(error),
      });
      const status = (error as any)?.status ?? error?.response?.status;
      const reason = String(
        (error as any)?.data?.reason ??
          error?.response?.data?.reason ??
          error?.message ??
          ""
      ).toLowerCase();
      if (
        status === 403 &&
        /purchase|plan|specimen|add more|limit/.test(reason)
      ) {
        setShowCollectionLimitSheet(true);
        return;
      }
      if (isSessionExpiryError(error)) {
        showToast("Session expired. Please sign in again.", "error");
        return;
      }
      showToast(error.message || "Failed to save bird details", "error");
    }
  }, [
    formData,
    initialData,
    mushroomId,
    specimenId,
    paramsInitialData,
    source,
    navigation,
    setEditResult,
    showToast,
  ]);

  const handleBack = useCallback(() => {
    if (isDirty) {
      showAlert(
        "Unsaved Changes",
        "You have unsaved changes. Are you sure you want to go back?",
        {
          secondaryText: "Cancel",
          primaryText: "Discard",
          onPrimary: () => navigation.goBack(),
          hideIcon: true,
          useCtaStyle: true,
        }
      );
    } else {
      navigation.goBack();
    }
  }, [isDirty, navigation]);

  const isFormValid = isDirty;

  const sectionTitleStyle = [
    typography.title.xsmallBold,
    { color: colors.textPrimary },
  ];

  const taxonomySubTitleStyle = [
    typography.body.mediumSemibold,
    { color: colors.textPrimary, marginBottom: spacing[1] },
  ];

  const renderSectionCard = (
    sectionId: EditMushroomTabId,
    title: string,
    children: React.ReactNode
  ) => (
    <View
      onLayout={(e) => {
        sectionYOffsets.current[sectionId] = e.nativeEvent.layout.y;
      }}
      style={[styles.sectionCard, { backgroundColor: SURFACE_PRIMARY }]}
    >
      <Text style={sectionTitleStyle}>{title}</Text>
      <View style={styles.fieldsGroup}>{children}</View>
    </View>
  );

  const getDropdownOptions = (optionKey: string) => {
    const fromApi = filterOptions[optionKey];
    if (fromApi?.length) return toDropdownOptions(fromApi);
    if (optionKey === "birdType") {
      return Object.entries(BIRD_TYPE_LABELS).map(([value, label]) => ({
        value,
        label,
      }));
    }
    if (optionKey === "conservationStatus") {
      return Object.entries(CONSERVATION_STATUS_LABELS).map(([value, label]) => ({
        value,
        label,
      }));
    }
    if (optionKey === "habitat") {
      return toDropdownOptions(filterOptions.habitat);
    }
    return [];
  };

  const getTaxonomyOptions = (
    key: string,
    currentValue?: string
  ): { label: string; value: string }[] => {
    const apiKey = `scientificClassification.${key}`;
    const fromApi =
      filterOptions[apiKey] ?? filterOptions[key] ?? ([] as string[]);
    const options = toDropdownOptions(fromApi);
    if (currentValue?.trim()) {
      const trimmed = currentValue.trim();
      if (!options.some((option) => option.value === trimmed)) {
        options.unshift({ label: trimmed, value: trimmed });
      }
    }
    return options;
  };

  const renderTaxonomyDropdown = (
    label: string,
    key: keyof NonNullable<EditableMushroomData["scientificClassification"]>
  ) => {
    const currentValue =
      formData?.scientificClassification?.[key] || "";
    const options = getTaxonomyOptions(key, currentValue);
    if (options.length === 0) {
      return (
        <BaseInputField
          {...inputFieldThemeProps}
          label={label}
          value={currentValue}
          onChangeText={(text) => updateClassification(key, text)}
          placeholder={`Enter ${label.toLowerCase()}`}
        />
      );
    }
    return (
      <Dropdown
        {...dropdownThemeProps}
        label={label}
        value={currentValue}
        onSelect={(value) => updateClassification(key, value)}
        options={options}
        placeholder={`Select ${label.toLowerCase()}`}
      />
    );
  };

  const renderTextArea = (
    label: string,
    value: string | undefined,
    onChange: (text: string) => void,
    placeholder: string,
    minHeight = 100
  ) => (
    <BaseTextArea
      {...textAreaThemeProps}
      label={label}
      value={value || ""}
      onChangeText={onChange}
      placeholder={placeholder}
      numberOfLines={4}
      minHeight={minHeight}
    />
  );

  const renderDropdown = (
    label: string,
    field: keyof EditableMushroomData,
    optionKey: string,
    placeholder?: string
  ) => (
    <Dropdown
      {...dropdownThemeProps}
      label={label}
      value={(formData?.[field] as string) || ""}
      onSelect={(value) => updateField(field, value as never)}
      options={getDropdownOptions(optionKey)}
      placeholder={placeholder ?? `Select ${label.toLowerCase()}`}
    />
  );

  if (!mushroomId) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: PAGE_BG }]}
        edges={["top", "bottom"]}
      >
        <View style={styles.centered}>
          <Text
            variant="body"
            size="medium"
            color="textSecondary"
            style={styles.centeredText}
          >
            Sighting not found. Please go back and try again.
          </Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backLink}
          >
            <Text
              variant="body"
              size="medium"
              style={{ color: colors.primary }}
            >
              Go back
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoadingData || !formData) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: PAGE_BG }]}
        edges={["top", "bottom"]}
      >
        <View style={styles.centered}>
          <Text variant="body" size="medium" color="textSecondary">
            {mushroomId && !paramsInitialData
              ? "Open this bird from its details screen to edit."
              : "Loading..."}
          </Text>
          {mushroomId && !paramsInitialData && (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backLink}
            >
              <Text
                variant="body"
                size="medium"
                style={{ color: colors.primary }}
              >
                Go back
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  const hasSounds =
    (formData.soundUrls?.length ?? 0) > 0 ||
    (formData.userCapturedSounds?.length ?? 0) > 0;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: PAGE_BG }]}
      edges={["top"]}
    >
      <View style={[styles.header, { backgroundColor: SURFACE_PRIMARY }]}>
        <TouchableOpacity
          onPress={handleBack}
          activeOpacity={0.7}
          style={styles.headerLeft}
          hitSlop={HIT_SLOP.CLOSE}
        >
          <NavBackIcon color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text
            variant="title"
            size="medium"
            weight="bold"
            style={{ color: colors.textPrimary }}
            numberOfLines={1}
          >
            {COLLECTION_STRINGS.screens.editBird}
          </Text>
        </View>
        <View style={{ width: 48 }} />
      </View>

      <View style={[styles.tabBarWrap, { backgroundColor: SURFACE_PRIMARY }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBarContent}
        >
          {editTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => {
                  setActiveTab(tab.id);
                  if (tab.id === "overview") {
                    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
                  }
                }}
                style={[
                  styles.tabItem,
                  isActive && {
                    borderBottomWidth: 2,
                    borderBottomColor: TAB_ACTIVE_COLOR,
                  },
                ]}
              >
                <Text
                  variant="body"
                  size="medium"
                  weight={isActive ? "bold" : "normal"}
                  numberOfLines={1}
                  style={{
                    color: isActive
                      ? TAB_ACTIVE_COLOR
                      : detailsSpec.TAB_INACTIVE_TEXT ?? colors.textSecondary,
                  }}
                >
                  {tab.label}
                </Text>
                {tab.premium ? (
                  <AppImage
                    source={Images.tabBatch}
                    style={styles.tabBadge}
                    resizeMode="contain"
                  />
                ) : null}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={[styles.scrollView, { backgroundColor: PAGE_BG }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {renderSectionCard(
          "overview",
          sectionStrings.overview,
          <>
            <BaseInputField
              {...inputFieldThemeProps}
              label="Common Name"
              value={formData.commonName || ""}
              onChangeText={(text) => updateField("commonName", text)}
              placeholder="Enter common name"
            />
            <BaseInputField
              {...inputFieldThemeProps}
              label="Scientific Name"
              value={formData.scientificName || ""}
              onChangeText={(text) => updateField("scientificName", text)}
              placeholder="Enter scientific name"
            />
            {renderTextArea(
              "Summary",
              formData.detailedDescription,
              (text) => {
                setIsDirty(true);
                setFormData((prev) =>
                  prev
                    ? { ...prev, detailedDescription: text, summary: text }
                    : prev
                );
              },
              "Enter description",
              100
            )}
            <View>
              <Text
                variant="label"
                size="small"
                weight="medium"
                style={{ marginBottom: 8, color: LABEL_COLOR }}
              >
                Photo(s)
              </Text>
              <PhotoPickerRow
                photos={formData.images || []}
                onChange={handlePhotosChange}
              />
            </View>
            <View>
              <View style={styles.locationLabelRow}>
                <Text
                  variant="label"
                  size="small"
                  style={{ color: LABEL_COLOR }}
                >
                  Custom Location
                </Text>
                <TouchableOpacity onPress={() => setShowLocationPicker(true)}>
                  <Text
                    variant="label"
                    size="small"
                    weight="medium"
                    style={styles.markOnMap}
                  >
                    Mark on map
                  </Text>
                </TouchableOpacity>
              </View>
              <View
                style={[
                  styles.locationInputRow,
                  {
                    backgroundColor: INPUT_BG,
                    borderColor: INPUT_BORDER,
                  },
                ]}
              >
                <AppImage
                  source={Images.locationEdit}
                  style={styles.locationIcon}
                  resizeMode="contain"
                />
                <TextInput
                  style={[styles.locationTextInput, { color: INPUT_TEXT }]}
                  value={formData.customLocation || ""}
                  onChangeText={(text) => updateField("customLocation", text)}
                  placeholder="Enter location"
                  placeholderTextColor={editSpec.PLACEHOLDER}
                />
              </View>
            </View>
            <View>
              <Text style={taxonomySubTitleStyle}>
                Scientific classification (Taxonomy)
              </Text>
              <View style={styles.taxonomyFields}>
                {TAXONOMY_FIELDS.map(([label, key]) => (
                  <React.Fragment key={key}>
                    {renderTaxonomyDropdown(label, key)}
                  </React.Fragment>
                ))}
              </View>
            </View>
            <Dropdown
              {...dropdownThemeProps}
              label={birdStrings.overview.size}
              value={formData.sizeCategory || ""}
              onSelect={(value) => {
                updateField("sizeCategory", value);
                const index = SIZE_OPTIONS.findIndex(
                  (option) => option.value === value
                );
                updateField("sizeScaleIndex", index >= 0 ? index : null);
              }}
              options={SIZE_OPTIONS}
              placeholder="Select size"
            />
            <MultiSelectDropdown
              label={birdStrings.overview.colors}
              labelTextColor={LABEL_COLOR}
              inputBackgroundColor={INPUT_BG}
              options={COLOR_OPTIONS}
              selectedValues={formData.dominantColors ?? []}
              onSelectionChange={(values) =>
                updateField("dominantColors", values)
              }
              placeholder="Select colors"
            />
            {renderTextArea(
              birdStrings.overview.family,
              formData.familyDescription,
              (text) => updateField("familyDescription", text),
              "Enter family description",
              80
            )}
          </>
        )}

        {renderSectionCard(
          "sounds",
          "Bird Sounds",
          <>
            {hasSounds ? (
              <BirdSoundsSection
                soundUrls={formData.soundUrls ?? []}
                userCapturedSounds={formData.userCapturedSounds}
                customLocation={formData.customLocation}
                textPrimary={colors.textPrimary}
                textSecondary={colors.textSecondary}
                surfaceSecondary={PAGE_BG}
              />
            ) : (
              <Text variant="body" size="medium" color="textSecondary">
                No bird sounds available for this sighting yet.
              </Text>
            )}
            <TouchableOpacity
              style={[
                styles.soundLibraryButton,
                { borderColor: INPUT_BORDER, backgroundColor: INPUT_BG },
              ]}
              onPress={() => navigateToSoundIdentify(navigation)}
              activeOpacity={0.8}
            >
              <Text
                variant="label"
                size="medium"
                weight="semibold"
                style={{ color: TAB_ACTIVE_COLOR }}
              >
                {COLLECTION_STRINGS.buttons.goToSoundLibrary}
              </Text>
            </TouchableOpacity>
          </>
        )}

        {renderSectionCard(
          "characteristics",
          sectionStrings.characteristics,
          <>
            <WizardSizePicker
              selectedIndex={formData.sizeScaleIndex ?? null}
              onSelect={(index) => {
                setIsDirty(true);
                setFormData((prev) =>
                  prev
                    ? {
                        ...prev,
                        sizeScaleIndex: index,
                        sizeCategory:
                          COLLECTION_STRINGS.birdDetails.sizeScale[index],
                      }
                    : prev
                );
              }}
            />
            {renderTextArea(
              birdStrings.characteristics.shape,
              formData.shape,
              (text) => updateField("shape", text),
              "Describe shape and silhouette"
            )}
            {renderTextArea(
              birdStrings.characteristics.beak,
              formData.beak,
              (text) => updateField("beak", text),
              "Describe beak shape and size"
            )}
            {renderTextArea(
              birdStrings.characteristics.tail,
              formData.tailShape,
              (text) => updateField("tailShape", text),
              "Describe tail shape"
            )}
            {renderTextArea(
              birdStrings.characteristics.legs,
              formData.legCharacteristics,
              (text) => updateField("legCharacteristics", text),
              "Describe leg and foot characteristics"
            )}
          </>
        )}

        {renderSectionCard(
          "behavior",
          sectionStrings.behavior,
          <>
            {renderTextArea(
              birdStrings.behavior.feeding,
              formData.feedingBehavior,
              (text) => updateField("feedingBehavior", text),
              "Describe feeding behavior"
            )}
            {renderTextArea(
              birdStrings.behavior.flight,
              formData.flightPattern,
              (text) => updateField("flightPattern", text),
              "e.g. Direct, undulating"
            )}
            {renderTextArea(
              birdStrings.behavior.vocal,
              formData.vocalBehavior,
              (text) => updateField("vocalBehavior", text),
              "Describe vocal behavior"
            )}
            {renderTextArea(
              birdStrings.behavior.territoriality,
              formData.territoriality,
              (text) => updateField("territoriality", text),
              "Describe territorial behavior"
            )}
            {renderTextArea(
              birdStrings.behavior.social,
              formData.socialBehavior,
              (text) => updateField("socialBehavior", text),
              "Describe social behavior"
            )}
          </>
        )}

        {renderSectionCard(
          "habitat",
          sectionStrings.habitat,
          <>
            {renderTextArea(
              birdStrings.habitat.habitat,
              formData.habitatType,
              (text) => updateField("habitatType", text),
              "Enter habitat"
            )}
            {renderTextArea(
              birdStrings.traits.preferredLocations,
              formData.preferredLocations,
              (text) => updateField("preferredLocations", text),
              "Preferred locations"
            )}
            <BaseInputField
              {...inputFieldThemeProps}
              label={birdStrings.traits.bestTime}
              value={formData.bestTimeToWatch || ""}
              onChangeText={(text) => updateField("bestTimeToWatch", text)}
              placeholder="Best time to watch"
            />
            {renderDropdown(
              birdStrings.habitat.conservation,
              "conservationStatus",
              "conservationStatus"
            )}
            {renderTextArea(
              birdStrings.habitat.distribution,
              formData.geographicDistribution,
              (text) => updateField("geographicDistribution", text),
              "Regions where found"
            )}
          </>
        )}

        {renderSectionCard(
          "feeding",
          sectionStrings.feeding,
          <>
            <Dropdown
              {...dropdownThemeProps}
              label={birdStrings.feeding.dietType}
              value={formData.dietType || ""}
              onSelect={(value) => updateField("dietType", value)}
              options={DIET_TYPE_OPTIONS}
              placeholder="Select diet type"
            />
            {renderTextArea(
              birdStrings.feeding.feedingStyle,
              formData.feedingStyle,
              (text) => updateField("feedingStyle", text),
              "Describe feeding style"
            )}
            {renderTextArea(
              birdStrings.feeding.diet,
              formData.diet,
              (text) => updateField("diet", text),
              "What this bird eats"
            )}
          </>
        )}

        {renderSectionCard(
          "breeding",
          sectionStrings.breeding,
          <>
            {renderTextArea(
              birdStrings.breeding.season,
              formData.breedingSeason,
              (text) => updateField("breedingSeason", text),
              "Breeding season timeline"
            )}
            {renderTextArea(
              birdStrings.breeding.nestType,
              formData.nestType,
              (text) => updateField("nestType", text),
              "Describe nest type"
            )}
            {renderTextArea(
              birdStrings.breeding.material,
              formData.nestingMaterial,
              (text) => updateField("nestingMaterial", text),
              "Nesting materials used"
            )}
            {renderTextArea(
              birdStrings.breeding.parentalCare,
              formData.parentalCare,
              (text) => updateField("parentalCare", text),
              "Parental care notes"
            )}
          </>
        )}

        {renderSectionCard(
          "migration",
          sectionStrings.migration,
          <>
            {renderTextArea(
              birdStrings.migration.resident,
              formData.residentStatus,
              (text) => updateField("residentStatus", text),
              "Resident or migratory status"
            )}
            {renderTextArea(
              birdStrings.migration.path,
              formData.migrationPath,
              (text) => updateField("migrationPath", text),
              "Migration path notes"
            )}
            {renderTextArea(
              birdStrings.migration.seasonal,
              formData.seasonalPresence,
              (text) => updateField("seasonalPresence", text),
              "Seasonal presence near you"
            )}
          </>
        )}
      </ScrollView>

      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: SURFACE_PRIMARY,
            borderTopColor: INPUT_BORDER,
          },
        ]}
      >
        <TouchableOpacity
          onPress={handleSave}
          disabled={!isFormValid}
          style={[
            styles.saveButtonBottom,
            {
              backgroundColor: isFormValid
                ? EDIT_BIRD_SAVE_COLOR
                : colors.surfaceVariant,
            },
          ]}
          activeOpacity={0.8}
        >
          <Text
            variant="label"
            size="medium"
            weight="semibold"
            style={{
              color: isFormValid
                ? isDark
                  ? SUBSCRIPTION_COLORS.CTA_TEXT_DARK
                  : SUBSCRIPTION_COLORS.CTA_TEXT_LIGHT
                : colors.textTertiary,
            }}
          >
            Save
          </Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showLocationPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        statusBarTranslucent
        onRequestClose={() => setShowLocationPicker(false)}
      >
        <SafeAreaView
          style={{ flex: 1, backgroundColor: colors.background }}
          edges={["top", "bottom"]}
        >
          <View style={{ flex: 1 }}>
            <View style={styles.locationModalHeader}>
              <Text variant="title" size="medium" weight="semibold">
                Select Location
              </Text>
              <TouchableOpacity onPress={() => setShowLocationPicker(false)}>
                <MaterialIcons
                  name="close"
                  size={24}
                  color={colors.textPrimary}
                />
              </TouchableOpacity>
            </View>
            <View style={{ flex: 1, padding: spacing[4] }}>
              <CustomLocationInput
                showMap={false}
                location={
                  formData.gpsLocation
                    ? {
                        latitude: formData.gpsLocation.latitude,
                        longitude: formData.gpsLocation.longitude,
                        address: formData.customLocation,
                      }
                    : {
                        latitude: DEFAULT_LOCATION.latitude,
                        longitude: DEFAULT_LOCATION.longitude,
                        address: formData.customLocation,
                      }
                }
                onLocationChange={(loc) => {
                  updateField("gpsLocation", {
                    latitude: loc.latitude,
                    longitude: loc.longitude,
                  });
                  if (loc.address) {
                    updateField("customLocation", loc.address);
                  }
                  setShowLocationPicker(false);
                }}
                onEdit={() => {}}
                editable
              />
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      <LimitReachedBottomSheet
        visible={showCollectionLimitSheet}
        onClose={() => setShowCollectionLimitSheet(false)}
        onUpgrade={() => {
          setShowCollectionLimitSheet(false);
          navigateToSubscriptionMain();
        }}
        limitType="collectionAlt"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: LAYOUT_MARGIN,
    paddingVertical: 12,
    minHeight: 52,
  },
  headerLeft: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    minWidth: 0,
  },
  tabBarWrap: {
    paddingVertical: 8,
  },
  tabBarContent: {
    paddingHorizontal: LAYOUT_MARGIN,
    gap: 4,
    alignItems: "center",
  },
  tabItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 32,
  },
  tabBadge: {
    width: 20,
    height: 20,
    marginLeft: 4,
  },
  scrollView: { flex: 1 },
  scrollContent: {
    paddingBottom: 120,
    gap: SECTION_GAP,
    paddingTop: SECTION_GAP,
  },
  sectionCard: {
    padding: LAYOUT_MARGIN,
    gap: 16,
  },
  fieldsGroup: { gap: spacing[4] },
  taxonomyFields: { gap: spacing[2] },
  locationLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  markOnMap: {
    color: MARK_ON_MAP_COLOR,
    textDecorationLine: "underline",
  },
  locationInputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 30,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    minHeight: 44,
  },
  locationIcon: {
    width: 20,
    height: 20,
    marginRight: spacing[3],
  },
  locationTextInput: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    paddingVertical: 0,
  },
  bottomBar: {
    borderTopWidth: 1,
    paddingHorizontal: LAYOUT_MARGIN,
    paddingTop: 12,
    paddingBottom: 32,
  },
  saveButtonBottom: {
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "stretch",
    minHeight: 44,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  centeredText: { textAlign: "center" },
  backLink: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: spacing[4],
  },
  locationModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  soundLibraryButton: {
    borderWidth: 1,
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
  },
});
