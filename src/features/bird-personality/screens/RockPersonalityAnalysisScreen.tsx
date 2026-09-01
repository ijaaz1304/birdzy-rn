/**
 * Rock Personality Analysis Screen
 * Loading screen with scanner overlay effect.
 */

import React, { useEffect, useMemo } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../../hooks/useTheme";
import { AppText } from "../../../components/shared";
import { BirdPersonalityStackParamList } from "../../../navigation/types";
import { calculateRockPersonality } from "../data/questionnaireData";
import {
  getQuizArchetypeImageSources,
  getQuizLocalImageSource,
} from "../../quiz/data/quizImageMap";
import { prefetchBundledSource } from "../../../imagePipeline/prefetchBundledSources";
import { logQuizCompleted } from "../quizAnalytics";
import { IdentificationScannerFrame } from "../../camera/components/IdentificationScannerFrame";
import { WhichBirdAreYouBackground } from "../components/WhichBirdAreYouBackground";

type NavigationProp = NativeStackNavigationProp<
  BirdPersonalityStackParamList,
  "Analysis"
>;

type RouteProp = {
  key: string;
  name: "Analysis";
  params: { photoUri?: string; answers: Record<string, string> };
};

export const BirdPersonalityAnalysisScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp>();
  const theme = useTheme();
  const colors = theme.colors;

  const { photoUri, answers } = route.params;
  const imageByMushroomId = useMemo(() => getQuizArchetypeImageSources(), []);
  const ANALYSIS_MS = 2500;

  useEffect(() => {
    const result = calculateRockPersonality(answers, imageByMushroomId);
    const localImage = getQuizLocalImageSource(result.mushroomId);
    if (localImage) prefetchBundledSource(localImage);

    const timer = setTimeout(() => {
      logQuizCompleted({
        mushroomId: result.mushroomId,
        mushroomName: result.mushroomName,
      });
      navigation.navigate("Result", {
        mushroomId: result.mushroomId,
        mushroomName: result.mushroomName,
        traits: result.traits,
        oneLiner: result.oneLiner,
        shareText: result.shareText,
        mushroomImageUri: result.image,
        photoUri,
      });
    }, ANALYSIS_MS);

    return () => clearTimeout(timer);
  }, [answers, photoUri, imageByMushroomId, navigation]);

  return (
    <View style={styles.container}>
      <WhichBirdAreYouBackground />
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.content}>
          {photoUri ? (
            <IdentificationScannerFrame
              imageUri={photoUri}
              style={styles.scannerFrame}
            />
          ) : null}

          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={{ marginBottom: 12 }}
          />

          <AppText
            variant="body16"
            color={colors.textSecondary}
            style={{ textAlign: "center" }}
          >
            Analyzing your data... almost there, stay tuned for the final result!
          </AppText>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  safeArea: {
    flex: 1,
    zIndex: 1,
    backgroundColor: "transparent",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    zIndex: 1,
  },

  scannerFrame: {
    marginBottom: 32,
  },
});
