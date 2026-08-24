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
} from "../../../molecules";
import { CollectionStackParamList } from "../../../navigation/types";
import { MushroomPhoto } from "../../../types/mushroom-media.types";
import { getDisplayName } from "../../../utils/mushroomDisplayUtils";
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
  EDIT_MUSHROOM_TABS,
  EDIT_BIRD_TABS,
  EditMushroomTabId,
  EditableMushroomData,
  buildMushroomUpdatePayload,
  buildMushroomSpecimenAddPayload,
  parseEditableMushroomData,
  toDropdownOptions,
} from "../editMushroomDetails.utils";
import { isBirdRecord } from "../../../utils/birdApiMappers";
import { COLLECTION_STRINGS } from "../../../config/strings/collection.strings";
import {
  BIRD_TYPE_LABELS,
  CONSERVATION_STATUS_LABELS,
} from "../../../constants/birdOptions";

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

  const isBird = useMemo(
    () =>
      isBirdRecord(
        (formData ?? initialData ?? paramsInitialData ?? {}) as Record<
          string,
          unknown
        >
      ),
    [formData, initialData, paramsInitialData]
  );

  const editTabs = isBird ? EDIT_BIRD_TABS : EDIT_MUSHROOM_TABS;
  const birdStrings = COLLECTION_STRINGS.birdDetails.traits;

  const scrollViewRef = useRef<ScrollView>(null);
  const sectionYOffsets = useRef<Record<EditMushroomTabId, number>>({
    overview: 0,
    safety: 0,
    similar: 0,
    physical: 0,
    habitat: 0,
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
    if (isBird && (activeTab === "safety" || activeTab === "similar")) {
      setActiveTab("overview");
    }
  }, [isBird, activeTab]);

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
        showToast("Failed to save mushroom", "error");
        return;
      }

      setEditResult({
        specimenId: String(newSpecimenId),
        mushroomId,
        specimenData: added as unknown as Record<string, unknown>,
      });
      showToast("Mushroom details saved successfully", "success");
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
      showToast("Mushroom details updated successfully", "success");
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
      showToast(error.message || "Failed to save mushroom details", "error");
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
    return [];
  };

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
            {isBird
              ? "Sighting not found. Please go back and try again."
              : "Mushroom not found. Please go back and try again."}
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
              ? "Open this mushroom from its details screen to edit."
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

  const classification = formData.scientificClassification ?? {};

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
            Edit sighting
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
                    borderBottomColor:
                      detailsSpec.TAB_ACTIVE_UNDERLINE ?? colors.primary,
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
                      ? detailsSpec.TAB_ACTIVE_UNDERLINE ?? colors.primary
                      : detailsSpec.TAB_INACTIVE_TEXT ?? colors.textSecondary,
                  }}
                >
                  {tab.label}
                </Text>
                {tab.id !== "overview" && (
                  <AppImage
                    source={Images.tabBatch}
                    style={styles.tabBadge}
                    resizeMode="contain"
                  />
                )}
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
          "Overview",
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
            <BaseTextArea
              {...textAreaThemeProps}
              label="Summary"
              value={formData.detailedDescription || ""}
              onChangeText={(text) => {
                setIsDirty(true);
                setFormData((prev) =>
                  prev
                    ? { ...prev, detailedDescription: text, summary: text }
                    : prev
                );
              }}
              placeholder="Enter description"
              numberOfLines={6}
              minHeight={100}
            />
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
                {(
                  [
                    ["Kingdom", "kingdom"],
                    ["Phylum", "phylum"],
                    ["Class", "class"],
                    ["Order", "order"],
                    ["Family", "family"],
                    ["Genus", "genus"],
                    ["Species", "species"],
                  ] as const
                ).map(([label, key]) => (
                  <BaseInputField
                    key={key}
                    {...inputFieldThemeProps}
                    label={label}
                    value={classification[key] || ""}
                    onChangeText={(text) => updateClassification(key, text)}
                    placeholder={`Enter ${label.toLowerCase()}`}
                  />
                ))}
              </View>
            </View>
          </>
        )}

        {!isBird &&
          renderSectionCard(
            "safety",
            "Safety",
            <>
              {renderDropdown("Edibility", "edibility", "edibility")}
              {renderDropdown(
                "Toxicity Severity",
                "toxicitySeverity",
                "toxicitySeverity"
              )}
              {renderDropdown("Psychoactive", "psychoactive", "psychoactive")}
              <BaseTextArea
                {...textAreaThemeProps}
                label="Symptoms if any"
                value={formData.symptoms || ""}
                onChangeText={(text) => updateField("symptoms", text)}
                placeholder="Describe symptoms"
                numberOfLines={4}
                minHeight={100}
              />
            </>
          )}

        {!isBird &&
          renderSectionCard(
            "similar",
            "Similar species",
            <>
              {(formData.lookAlikes ?? []).length > 0 ? (
                (formData.lookAlikes ?? []).map((item, index) => (
                  <View
                    key={`${item.scientificName}-${index}`}
                    style={styles.lookAlikeRow}
                  >
                    <Text
                      variant="body"
                      size="medium"
                      weight="semibold"
                      style={{ color: colors.textPrimary }}
                    >
                      {getDisplayName(item) || item.scientificName}
                    </Text>
                    {item.keyDifferences ? (
                      <Text
                        variant="body"
                        size="small"
                        color="textSecondary"
                        style={{ marginTop: 4 }}
                      >
                        {item.keyDifferences}
                      </Text>
                    ) : null}
                  </View>
                ))
              ) : (
                <Text variant="body" size="medium" color="textSecondary">
                  No similar species listed.
                </Text>
              )}
            </>
          )}

        {renderSectionCard(
          "physical",
          isBird ? "Identification" : "Physical Traits",
          <>
            {isBird ? (
              <>
                <BaseInputField
                  {...inputFieldThemeProps}
                  label={birdStrings.length}
                  value={formData.lengthRange || ""}
                  onChangeText={(text) => updateField("lengthRange", text)}
                  placeholder="e.g. 18–25 cm"
                />
                <BaseInputField
                  {...inputFieldThemeProps}
                  label={birdStrings.wingspan}
                  value={formData.wingspanRange || ""}
                  onChangeText={(text) => updateField("wingspanRange", text)}
                  placeholder="e.g. 32–40 cm"
                />
                <BaseInputField
                  {...inputFieldThemeProps}
                  label={birdStrings.weight}
                  value={formData.weightRange || ""}
                  onChangeText={(text) => updateField("weightRange", text)}
                  placeholder="e.g. 30–45 g"
                />
                <BaseTextArea
                  {...textAreaThemeProps}
                  label={birdStrings.colors}
                  value={formData.dominantColors || ""}
                  onChangeText={(text) => updateField("dominantColors", text)}
                  placeholder="Comma-separated colors"
                  numberOfLines={3}
                  minHeight={80}
                />
                <BaseTextArea
                  {...textAreaThemeProps}
                  label={birdStrings.flightPattern}
                  value={formData.flightPattern || ""}
                  onChangeText={(text) => updateField("flightPattern", text)}
                  placeholder="e.g. Direct, undulating"
                  numberOfLines={3}
                  minHeight={80}
                />
                <BaseTextArea
                  {...textAreaThemeProps}
                  label={birdStrings.flightAltitude}
                  value={formData.flightAltitude || ""}
                  onChangeText={(text) => updateField("flightAltitude", text)}
                  placeholder="e.g. Low, canopy"
                  numberOfLines={3}
                  minHeight={80}
                />
                <BaseTextArea
                  {...textAreaThemeProps}
                  label={birdStrings.keyMarks}
                  value={formData.keyIdentificationMarks || ""}
                  onChangeText={(text) =>
                    updateField("keyIdentificationMarks", text)
                  }
                  placeholder="Field marks for ID"
                  numberOfLines={4}
                  minHeight={100}
                />
                {renderDropdown(
                  birdStrings.birdType,
                  "birdType",
                  "birdType"
                )}
                {renderDropdown(
                  birdStrings.conservation,
                  "conservationStatus",
                  "conservationStatus"
                )}
              </>
            ) : (
              <>
                {renderDropdown("Cap Shape", "capShape", "capShape")}
                <BaseTextArea
                  {...textAreaThemeProps}
                  label="Cap Surface"
                  value={formData.capSurface || ""}
                  onChangeText={(text) => updateField("capSurface", text)}
                  placeholder="Describe cap surface"
                  numberOfLines={4}
                  minHeight={100}
                />
                <BaseInputField
                  {...inputFieldThemeProps}
                  label="Cap Color"
                  value={formData.capColor || ""}
                  onChangeText={(text) => updateField("capColor", text)}
                  placeholder="Enter cap color"
                />
                {renderDropdown(
                  "Underside Type",
                  "undersideType",
                  "undersideType"
                )}
                {renderDropdown("Stem Presence", "stemPresence", "stemPresence")}
                {renderDropdown("Stem Surface", "stemSurface", "stemSurface")}
                {renderDropdown("Ring Present", "ringPresent", "ringPresent")}
                {renderDropdown("Volva Present", "volvaPresent", "volvaPresent")}
                <BaseTextArea
                  {...textAreaThemeProps}
                  label="Size Range"
                  value={formData.capDiameterRange || ""}
                  onChangeText={(text) => updateField("capDiameterRange", text)}
                  placeholder="Enter size range"
                  numberOfLines={4}
                  minHeight={100}
                />
              </>
            )}
          </>
        )}

        {renderSectionCard(
          "habitat",
          isBird ? "Habitat & Diet" : "Habitat and distribution",
          <>
            <BaseTextArea
              {...textAreaThemeProps}
              label={
                isBird
                  ? COLLECTION_STRINGS.birdDetails.habitat.habitat
                  : "Habitat Type"
              }
              value={formData.habitatType || ""}
              onChangeText={(text) => updateField("habitatType", text)}
              placeholder="Enter habitat"
              numberOfLines={4}
              minHeight={100}
            />
            {isBird ? (
              <>
                <BaseTextArea
                  {...textAreaThemeProps}
                  label={COLLECTION_STRINGS.birdDetails.habitat.diet}
                  value={formData.diet || ""}
                  onChangeText={(text) => updateField("diet", text)}
                  placeholder="What this bird eats"
                  numberOfLines={4}
                  minHeight={100}
                />
                <BaseTextArea
                  {...textAreaThemeProps}
                  label={COLLECTION_STRINGS.birdDetails.habitat.distribution}
                  value={formData.geographicDistribution || ""}
                  onChangeText={(text) =>
                    updateField("geographicDistribution", text)
                  }
                  placeholder="Regions where found"
                  numberOfLines={4}
                  minHeight={100}
                />
                <BaseInputField
                  {...inputFieldThemeProps}
                  label={birdStrings.bestTime}
                  value={formData.bestTimeToWatch || ""}
                  onChangeText={(text) => updateField("bestTimeToWatch", text)}
                  placeholder="Best time to watch"
                />
                <BaseInputField
                  {...inputFieldThemeProps}
                  label={birdStrings.preferredLocations}
                  value={formData.preferredLocations || ""}
                  onChangeText={(text) =>
                    updateField("preferredLocations", text)
                  }
                  placeholder="Preferred locations"
                />
              </>
            ) : (
              <>
                <BaseTextArea
                  {...textAreaThemeProps}
                  label="Growth Pattern"
                  value={formData.growthPattern || ""}
                  onChangeText={(text) => updateField("growthPattern", text)}
                  placeholder="Enter growth pattern"
                  numberOfLines={4}
                  minHeight={100}
                />
                <BaseTextArea
                  {...textAreaThemeProps}
                  label="Geographic Distribution"
                  value={formData.geographicDistribution || ""}
                  onChangeText={(text) =>
                    updateField("geographicDistribution", text)
                  }
                  placeholder="Enter geographic distribution"
                  numberOfLines={4}
                  minHeight={100}
                />
                <BaseTextArea
                  {...textAreaThemeProps}
                  label="Fruiting Season"
                  value={formData.fruitingSeasonText || ""}
                  onChangeText={(text) => updateField("fruitingSeasonText", text)}
                  placeholder="Enter fruiting season"
                  numberOfLines={4}
                  minHeight={100}
                />
                <BaseTextArea
                  {...textAreaThemeProps}
                  label="Geographic Distribution Hotspots"
                  value={formData.distributionHotspotsText || ""}
                  onChangeText={(text) =>
                    updateField("distributionHotspotsText", text)
                  }
                  placeholder="Enter distribution hotspots"
                  numberOfLines={4}
                  minHeight={100}
                />
              </>
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
                ? colors.primaryCTA
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
  lookAlikeRow: {
    paddingVertical: spacing[2],
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
});
