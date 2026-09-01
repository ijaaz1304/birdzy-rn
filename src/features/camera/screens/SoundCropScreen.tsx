/**
 * Crop a live recording before sound identification.
 * Figma 8908:90380 / 8908:90466 — fixed 9/18/27s window, drag to move.
 */

import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { FindYourBirdBackground } from "../../bird-personality/components/FindYourBirdBackground";
import { CameraStackParamList } from "../../../navigation/types";
import { useTheme } from "../../../hooks/useTheme";
import {
  SoundRecordingCropContent,
  type SoundCropSession,
} from "../components/SoundRecordingCropContent";
import { useSoundRecordingSpectrogramStore } from "../soundRecordingSpectrogram.store";

type Nav = NativeStackNavigationProp<CameraStackParamList, "SoundCrop">;
type ScreenRoute = RouteProp<CameraStackParamList, "SoundCrop">;

export const SoundCropScreen: React.FC = () => {
  const theme = useTheme();
  const colors = theme.colors;
  const navigation = useNavigation<Nav>();
  const { audioUri, durationSec, recordedAt, spectrogramColumns } =
    useRoute<ScreenRoute>().params;

  useEffect(() => {
    if (spectrogramColumns && spectrogramColumns.length > 0) {
      useSoundRecordingSpectrogramStore.getState().setColumns(spectrogramColumns);
    }
  }, [spectrogramColumns]);

  const session: SoundCropSession = {
    audioUri,
    durationSec,
    recordedAt,
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.surfacePrimary }]}>
      <FindYourBirdBackground />
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <SoundRecordingCropContent
          session={session}
          navigation={navigation}
          onBack={() => navigation.goBack()}
        />
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
});
