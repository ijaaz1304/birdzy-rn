/**
 * Rock Personality Intro Screen
 * Full screen version of the intro modal.
 * "Find out now" navigates to PhotoSelection screen (camera or upload) as a page, not a modal.
 */

import { AppImage } from "@/components/AppImage";
import React, { useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme, useIsDark } from "../../../hooks/useTheme";
import { AppText, AppButton } from "../../../components/shared";
import { Images, CancelIconLight, CancelIconDark, QUIZ_MUSHROOM_LOCAL_IMAGES } from "../../../assets";
import { BirdPersonalityStackParamList } from "../../../navigation/types";
import { FindYourMushroomBackground } from "../components/FindYourMushroomBackground";
import { AskAIScreenBackground } from "../../ask-ai/components/AskAIScreenBackground";
import { usePopParentStackOnBack } from "../../../hooks/usePopParentStackOnBack";
import { QUESTIONNAIRE_QUESTIONS } from "../data/questionnaireData";
import { logQuizStarted } from "../quizAnalytics";
import { prefetchBundledSources } from "../../../imagePipeline/prefetchBundledSources";

import { FONTS } from "../../../common/typography";

type NavigationProp = NativeStackNavigationProp<
  BirdPersonalityStackParamList,
  "BirdPersonalityIntro"
>;

export const BirdPersonalityIntroScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  usePopParentStackOnBack();
  const theme = useTheme();
  const colors = theme.colors;
  const Space = theme.spacing;
  const Radius = theme.radius;
  const isDark = useIsDark();
  const { height: screenHeight } = useWindowDimensions();
  const isCompact = screenHeight < 740;
  const heroImageSize = isCompact ? 168 : 200;

  useEffect(() => {
    prefetchBundledSources(Object.values(QUIZ_MUSHROOM_LOCAL_IMAGES));
  }, []);

  return (
    <View style={styles.container}>
      {isDark ? <AskAIScreenBackground /> : <FindYourMushroomBackground />}
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.headerRow}>
          <AppText
            variant="title20"
            color={colors.textPrimary}
            style={styles.headerTitle}
          >
            Find Your Bird
          </AppText>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => {
              const parent = navigation.getParent();
              if (parent?.canGoBack()) {
                parent.goBack();
                return;
              }
              navigation.goBack();
            }}
            activeOpacity={0.7}
          >
            {isDark ? (
              <CancelIconDark width={24} height={24} />
            ) : (
              <CancelIconLight width={24} height={24} />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View
            style={[
              styles.mainContent,
              { paddingTop: isCompact ? 56 : 80 },
            ]}
          >
            <View style={styles.imageContainer}>
              <AppImage
                source={Images.mushroomPersonalityImage}
                style={{
                  width: heroImageSize,
                  height: heroImageSize,
                }}
                resizeMode="contain"
                preferRNImage
                fadeDuration={0}
              />
            </View>
            <View style={styles.textContainer}>
              <AppText
                variant="title20"
                color={colors.textPrimary}
                style={styles.title}
              >
                Owl, Robin, or Bald Eagle?
              </AppText>
              <AppText
                variant="body16"
                color={colors.textSecondary}
                style={styles.subtitle}
              >
                Upload a photo and answer a few questions to discover which
                bird matches your birder personality!
              </AppText>
            </View>
          </View>

          <View
            style={[
              styles.buttonContainer,
              {
                paddingTop: isCompact ? 8 : 12,
                marginBottom: isCompact ? 12 : 20,
              },
            ]}
          >
            <AppButton
              title="Find out now"
              size="large"
              variant="primary"
              onPress={() => {
                logQuizStarted(QUESTIONNAIRE_QUESTIONS.length);
                navigation.navigate("PhotoSelection");
              }}
              style={{
                backgroundColor: colors.primary,
                borderRadius: Radius["2xl"],
                paddingVertical: Space[3],
                alignSelf: "stretch",
                minHeight: 44,
              }}
              textStyle={{ color: colors.onPrimary }}
            />
          </View>
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
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerTitle: {
    flex: 1,
    fontFamily: FONTS.bold,
    paddingRight: 12,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  mainContent: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  imageContainer: {
    marginBottom: 24,
    alignItems: "center",
  },
  textContainer: {
    width: "100%",
    maxWidth: 327,
    alignItems: "center",
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 20,
    lineHeight: 28,
    textAlign: "center",
    width: "100%",
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: "center",
    marginTop: 8,
    width: "100%",
  },
  buttonContainer: {
    width: "100%",
    flexShrink: 0,
    marginTop: "auto",
  },
});
