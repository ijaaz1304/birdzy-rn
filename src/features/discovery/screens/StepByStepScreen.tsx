/**
 * Step-by-step Identify wizard — Figma 8890:124531 / 124249 / 124480 / 124443 / 124410.
 * After the last question (or an Edit from Possible Matches), runs the same
 * analyze → Possible Matches flow as photo identification.
 */

import { AppImage } from "@/components/AppImage";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useFocusEffect, useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  Images,
  WizardClockIcon,
  WizardCurrentLocationIcon,
  WizardMapPinIcon,
} from "../../../assets";
import { CloseIcon } from "../../../components/shared/CloseIcon";
import { Text } from "../../../atoms";
import { ChangeLocationBottomSheet } from "../../../molecules/Modal";
import { HOME_STRINGS } from "../../../config/strings/home.strings";
import { HIT_SLOP } from "../../../constants/uiConstants";
import { FONTS } from "../../../common/typography";
import { Radius } from "../../../design";
import { FindYourBirdBackground } from "../../bird-personality/components/FindYourBirdBackground";
import { useTheme } from "../../../hooks/useTheme";
import { HomeStackParamList } from "../../../navigation/types";
import { getCurrentLocation } from "../../../utils/locationService";
import { resolveLocationAddress } from "../../camera/resolveLocationAddress";
import type { IdentificationLocation } from "../../camera/identificationLocation.store";
import { useStepByStepStore } from "../stepByStep.store";
import { WIZARD_QUESTIONS } from "../stepByStep.types";
import type { WizardRecentLocation } from "../stepByStep.types";
import { WizardCalendar } from "../components/WizardCalendar";
import { WizardProgressHeader } from "../components/WizardProgressHeader";
import { WizardSizePicker } from "../components/WizardSizePicker";
import {
  hasWizardQuestionAnswer,
  isoDateToday,
  wizardQuestionTitle,
} from "../utils/stepByStepAnswers";

type Nav = NativeStackNavigationProp<HomeStackParamList, "StepByStep">;
type ScreenRoute = RouteProp<HomeStackParamList, "StepByStep">;

function toRecentLocation(
  location: IdentificationLocation
): WizardRecentLocation {
  return {
    label: location.address,
    latitude: location.latitude,
    longitude: location.longitude,
  };
}

export const StepByStepScreen: React.FC = () => {
  const theme = useTheme();
  const colors = theme.colors;
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const route = useRoute<ScreenRoute>();
  const strings = HOME_STRINGS.discovery.stepByStep;

  const answers = useStepByStepStore((s) => s.answers);
  const recentLocations = useStepByStepStore((s) => s.recentLocations);
  const setLocation = useStepByStepStore((s) => s.setLocation);
  const setSeenDate = useStepByStepStore((s) => s.setSeenDate);
  const setSizeIndex = useStepByStepStore((s) => s.setSizeIndex);
  const rememberLocation = useStepByStepStore((s) => s.rememberLocation);

  const [phase, setPhase] = useState<"intro" | "question">("intro");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [showLocationSheet, setShowLocationSheet] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationSource, setLocationSource] = useState<
    "search" | "current" | "recent" | null
  >(null);
  /** Snapshot on entering location step — avoids showing Recently Used on first-ever pick. */
  const [showRecentlyUsed, setShowRecentlyUsed] = useState(false);

  const question = WIZARD_QUESTIONS[questionIndex] ?? "location";
  const storeEditQuestion = useStepByStepStore((s) => s.editQuestion);
  const isEditSession = Boolean(
    route.params?.editQuestion ?? storeEditQuestion
  );

  useEffect(() => {
    if (phase === "question" && question === "location") {
      setShowRecentlyUsed(
        useStepByStepStore.getState().hasUsedWizardLocation
      );
    }
  }, [phase, question, questionIndex]);

  useFocusEffect(
    useCallback(() => {
      const edit =
        route.params?.editQuestion ??
        useStepByStepStore.getState().editQuestion;
      if (edit) {
        const idx = WIZARD_QUESTIONS.indexOf(edit);
        setPhase("question");
        setQuestionIndex(idx >= 0 ? idx : 0);
        return;
      }
      if (route.params?.startFresh) {
        useStepByStepStore.getState().resetAnswers();
        setPhase("intro");
        setQuestionIndex(0);
        setLocationSource(null);
        navigation.setParams({ startFresh: undefined, editQuestion: undefined });
      }
    }, [navigation, route.params?.editQuestion, route.params?.startFresh])
  );

  const applyLocation = useCallback(
    (location: WizardRecentLocation, source: "search" | "current" | "recent") => {
      setLocation(location);
      rememberLocation(location);
      setLocationSource(source);
    },
    [rememberLocation, setLocation]
  );

  const startAnalyze = useCallback(() => {
    useStepByStepStore.getState().setEditQuestion(null);
    navigation.getParent()?.navigate("Camera", {
      screen: "DiagnosisLoading",
      params: { identifyMode: "stepByStep" },
    });
  }, [navigation]);

  const goNext = useCallback(() => {
    if (isEditSession) {
      startAnalyze();
      return;
    }
    if (questionIndex >= WIZARD_QUESTIONS.length - 1) {
      startAnalyze();
      return;
    }
    setQuestionIndex((index) => index + 1);
  }, [isEditSession, questionIndex, startAnalyze]);

  const goBack = useCallback(() => {
    if (phase === "intro") {
      navigation.goBack();
      return;
    }
    if (isEditSession) {
      startAnalyze();
      return;
    }
    if (questionIndex === 0) {
      setPhase("intro");
      return;
    }
    setQuestionIndex((index) => index - 1);
  }, [isEditSession, navigation, phase, questionIndex, startAnalyze]);

  const nextEnabled = useMemo(() => {
    if (question === "date") return Boolean(answers.seenDate);
    return hasWizardQuestionAnswer(question, answers);
  }, [answers, question]);

  const handleCurrentLocation = useCallback(async () => {
    setLocating(true);
    try {
      const loc = await getCurrentLocation({ timeout: 12000 });
      if (loc?.latitude == null || loc?.longitude == null) return;
      const label = await resolveLocationAddress(loc.latitude, loc.longitude);
      applyLocation(
        { label, latitude: loc.latitude, longitude: loc.longitude },
        "current"
      );
    } finally {
      setLocating(false);
    }
  }, [applyLocation]);

  useEffect(() => {
    if (answers.location && locationSource == null) {
      setLocationSource("search");
    }
  }, [answers.location, locationSource]);

  const renderQuestionBody = () => {
    switch (question) {
      case "location":
        return (
          <View style={styles.questionBlock}>
            <Text style={[styles.questionTitle, { color: colors.textPrimary }]}>
              {wizardQuestionTitle(0, strings.questions.location)}
            </Text>
            <View style={styles.locationSections}>
              <View style={styles.locationSection}>
                <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>
                  {strings.customLocation}
                </Text>
                <TouchableOpacity
                  onPress={() => setShowLocationSheet(true)}
                  style={[
                    styles.locationRow,
                    {
                      backgroundColor: colors.surfacePrimary,
                      borderColor:
                        locationSource === "search" && answers.location
                          ? colors.primaryCTA
                          : colors.border0,
                    },
                  ]}
                >
                  <WizardMapPinIcon width={20} height={20} />
                  <Text
                    style={[
                      styles.locationRowLabel,
                      {
                        color: answers.location
                          ? colors.textPrimary
                          : colors.textTertiary,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {answers.location?.label ?? strings.enterLocation}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.locationSection}>
                <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>
                  {strings.customLocation}
                </Text>
                <TouchableOpacity
                  onPress={() => void handleCurrentLocation()}
                  style={[
                    styles.locationRow,
                    {
                      backgroundColor: colors.surfacePrimary,
                      borderColor:
                        locationSource === "current"
                          ? colors.primaryCTA
                          : colors.border0,
                    },
                  ]}
                >
                  <WizardCurrentLocationIcon width={20} height={20} />
                  <Text
                    style={[
                      styles.locationRowLabel,
                      { color: colors.textTertiary },
                    ]}
                  >
                    {strings.currentLocation}
                  </Text>
                  {locating ? (
                    <ActivityIndicator size="small" color={colors.primaryCTA} />
                  ) : null}
                </TouchableOpacity>
              </View>

              {showRecentlyUsed && recentLocations.length > 0 ? (
                <View style={styles.locationSection}>
                  <Text
                    style={[styles.fieldLabel, { color: colors.textPrimary }]}
                  >
                    {strings.recentlyUsed}
                  </Text>
                  {recentLocations.map((item) => (
                    <TouchableOpacity
                      key={`${item.label}-${item.latitude}`}
                      onPress={() => applyLocation(item, "recent")}
                      style={styles.recentRow}
                    >
                      <WizardClockIcon width={20} height={20} />
                      <Text
                        style={[
                          styles.locationRowLabel,
                          { color: colors.textPrimary },
                        ]}
                        numberOfLines={1}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null}
            </View>
          </View>
        );
      case "date":
        return (
          <View style={styles.questionBlock}>
            <Text style={[styles.questionTitle, { color: colors.textPrimary }]}>
              {wizardQuestionTitle(1, strings.questions.date)}
            </Text>
            <WizardCalendar
              selectedIso={answers.seenDate}
              onSelect={setSeenDate}
              onResetToday={() => setSeenDate(isoDateToday())}
              resetLabel={strings.resetToday}
            />
          </View>
        );
      case "size":
        return (
          <View style={styles.questionBlock}>
            <Text style={[styles.questionTitle, { color: colors.textPrimary }]}>
              {wizardQuestionTitle(2, strings.questions.size)}
            </Text>
            <View style={styles.sizeBody}>
              <WizardSizePicker
                selectedIndex={answers.sizeIndex}
                onSelect={setSizeIndex}
              />
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.surfacePrimary }]}>
      <FindYourBirdBackground />
      <SafeAreaView style={styles.safe} edges={["top"]}>
        {phase === "intro" ? (
          <>
            <View style={styles.introHeader}>
              <Text
                style={[styles.introNavTitle, { color: colors.textPrimary }]}
                numberOfLines={1}
              >
                {strings.title}
              </Text>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                hitSlop={HIT_SLOP.CLOSE}
                accessibilityRole="button"
                accessibilityLabel={strings.closeA11y}
              >
                <CloseIcon variant="plain" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <View style={styles.introBody}>
              <AppImage
                source={Images.wizardFindYourBird}
                style={styles.introArt}
                resizeMode="contain"
              />
              <Text style={[styles.introTitle, { color: colors.textPrimary }]}>
                {strings.introTitle}
              </Text>
              <Text
                style={[styles.introCopy, { color: colors.textTertiary }]}
              >
                {strings.introBody}
              </Text>
            </View>
            <View
              style={[
                styles.footer,
                { paddingBottom: Math.max(insets.bottom, 16) },
              ]}
            >
              <TouchableOpacity
                onPress={() => setPhase("question")}
                activeOpacity={0.85}
                style={[
                  styles.cta,
                  { backgroundColor: colors.primaryCTA },
                ]}
              >
                <Text style={styles.ctaLabel}>{strings.findOutNow}</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <WizardProgressHeader
              questionIndex={questionIndex}
              onBack={goBack}
              onSkip={goNext}
              skipLabel={strings.skip}
            />
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {renderQuestionBody()}
            </ScrollView>
            <View
              style={[
                styles.footer,
                { paddingBottom: Math.max(insets.bottom, 16) },
              ]}
            >
              <TouchableOpacity
                onPress={goNext}
                disabled={!nextEnabled}
                activeOpacity={0.85}
                style={[
                  styles.cta,
                  {
                    backgroundColor: nextEnabled
                      ? colors.primaryCTA
                      : colors.borderSecondary,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.ctaLabel,
                    {
                      color: nextEnabled
                        ? "#FFFFFF"
                        : colors.textTertiary,
                    },
                  ]}
                >
                  {strings.next}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </SafeAreaView>

      <ChangeLocationBottomSheet
        visible={showLocationSheet}
        onClose={() => setShowLocationSheet(false)}
        variant={answers.location ? "custom" : "add"}
        initialQuery={answers.location?.label}
        onConfirm={(location) => {
          applyLocation(toRecentLocation(location), "search");
          setShowLocationSheet(false);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  introHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 20,
    paddingRight: 12,
    paddingVertical: 12,
    minHeight: 52,
    gap: 8,
  },
  introNavTitle: {
    flex: 1,
    fontFamily: FONTS.bold,
    fontSize: 18,
    lineHeight: 24,
  },
  introBody: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 54,
    gap: 8,
    marginTop: -40,
  },
  introArt: {
    width: 150,
    height: 137,
  },
  introTitle: {
    fontFamily: FONTS.bold,
    fontSize: 24,
    lineHeight: 32,
    textAlign: "center",
    marginTop: 8,
  },
  introCopy: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  questionBlock: {
    gap: 24,
    paddingTop: 12,
  },
  questionTitle: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    lineHeight: 24,
  },
  locationSections: {
    gap: 20,
  },
  locationSection: {
    gap: 8,
  },
  fieldLabel: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  locationRowLabel: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: -0.16,
  },
  recentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 4,
  },
  sizeBody: {
    flexGrow: 1,
    minHeight: 280,
    justifyContent: "center",
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  cta: {
    height: 44,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaLabel: {
    fontFamily: FONTS.medium,
    fontSize: 16,
    lineHeight: 24,
    color: "#FFFFFF",
  },
});
