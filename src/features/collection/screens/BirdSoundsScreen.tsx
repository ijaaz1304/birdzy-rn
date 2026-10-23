import React, { useCallback, useMemo, useState } from "react";
import { FlatList, StyleSheet, TouchableOpacity, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { RouteProp, useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { NavBackIcon, Text } from "../../../atoms";
import { FONTS } from "../../../common/typography";
import { COLLECTION_STRINGS } from "../../../config/strings/collection.strings";
import { HIT_SLOP } from "../../../constants/uiConstants";
import { spacing } from "../../../design-system/spacing";
import { useTheme } from "../../../hooks/useTheme";
import { CollectionStackParamList } from "../../../navigation/types";
import { soundRecordingService } from "../../../services/audio/soundRecording.service";
import { BirdSoundRow } from "../components/BirdSoundRow";
import { buildBirdSoundListItems } from "../utils/birdSoundListItems";
import { useBirdSoundDurations } from "../hooks/useBirdSoundDurations";

type Route = RouteProp<CollectionStackParamList, "BirdSounds">;
type Nav = NativeStackNavigationProp<CollectionStackParamList, "BirdSounds">;

export const BirdSoundsScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const { textPrimary, textSecondary, surfacePrimary, surfaceSecondary } =
    useTheme().colors;
  const strings = COLLECTION_STRINGS.birdDetails.sounds;

  const [playingId, setPlayingId] = useState<string | null>(null);
  const allUrls = useMemo(
    () => [
      ...(route.params.soundUrls ?? []),
      ...(route.params.userCapturedSounds ?? []),
    ],
    [route.params.soundUrls, route.params.userCapturedSounds]
  );
  const probedDurations = useBirdSoundDurations(allUrls);
  const durationsSec = useMemo(
    () => ({ ...route.params.durationsSec, ...probedDurations }),
    [route.params.durationsSec, probedDurations]
  );

  const items = useMemo(
    () =>
      buildBirdSoundListItems({
        soundUrls: route.params.soundUrls,
        userCapturedSounds: route.params.userCapturedSounds,
        customLocation: route.params.customLocation,
        createdAt: route.params.createdAt,
        updatedAt: route.params.updatedAt,
        durationsSec,
      }),
    [
      route.params.soundUrls,
      route.params.userCapturedSounds,
      route.params.customLocation,
      route.params.createdAt,
      route.params.updatedAt,
      durationsSec,
    ]
  );

  useFocusEffect(
    useCallback(() => {
      return () => {
        setPlayingId(null);
        void soundRecordingService.stopPlayback();
      };
    }, [])
  );

  const togglePlay = useCallback(
    async (id: string, url: string) => {
      if (playingId === id) {
        setPlayingId(null);
        void soundRecordingService.stopPlayback();
        return;
      }
      setPlayingId(id);
      try {
        await soundRecordingService.play(url, {
          onEnd: () => {
            setPlayingId((current) => (current === id ? null : current));
          },
        });
      } catch {
        setPlayingId((current) => (current === id ? null : current));
      }
    },
    [playingId]
  );

  return (
    <View style={[styles.root, { backgroundColor: surfacePrimary }]}>
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View
          style={[
            styles.header,
            { paddingTop: insets.top > 0 ? 0 : spacing[2] },
          ]}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={HIT_SLOP.CLOSE}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <NavBackIcon color={textPrimary} size={24} />
          </TouchableOpacity>
          <Text
            style={[styles.headerTitle, { color: textPrimary }]}
            numberOfLines={1}
          >
            {strings.screenTitle}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom, spacing[5]) },
          ]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <BirdSoundRow
              item={item}
              isPlaying={playingId === item.id}
              onPress={() => void togglePlay(item.id, item.url)}
              surfaceSecondary={surfaceSecondary}
              textPrimary={textPrimary}
              textSecondary={textSecondary}
            />
          )}
        />
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[3],
    paddingBottom: spacing[3],
    minHeight: 52,
    gap: spacing[2],
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontFamily: FONTS.bold,
    fontSize: 18,
    lineHeight: 24,
  },
  headerSpacer: { width: 24 },
  listContent: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[3],
    gap: spacing[3],
  },
});
