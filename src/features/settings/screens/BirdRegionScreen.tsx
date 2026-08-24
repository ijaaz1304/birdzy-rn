/**
 * Birding region preference — draft list picker (product spec M).
 */

import React, { useCallback, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useTheme } from "../../../hooks/useTheme";
import { Text, NavBackIcon } from "../../../atoms";
import { Card } from "../../../molecules";
import { SETTINGS_STRINGS } from "../../../config/strings/settings.strings";
import {
  BIRD_REGION_OPTIONS,
  getBirdRegionPreference,
  setBirdRegionPreference,
  type BirdRegionId,
} from "../../../services/session/birdRegionPreference.service";
import { spacing } from "../../../design-system/spacing";

export const BirdRegionScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const strings = SETTINGS_STRINGS.birdRegion;
  const [selected, setSelected] = useState<BirdRegionId>("auto");

  useFocusEffect(
    useCallback(() => {
      void getBirdRegionPreference().then(setSelected);
    }, [])
  );

  const selectRegion = async (regionId: BirdRegionId) => {
    setSelected(regionId);
    await setBirdRegionPreference(regionId);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <NavBackIcon color={theme.colors.text} />
        </TouchableOpacity>
        <Text variant="title" size="medium" weight="semibold">
          {strings.title}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <Text
        variant="body"
        size="small"
        color="textSecondary"
        style={styles.subtitle}
      >
        {strings.subtitle}
      </Text>

      <ScrollView style={styles.content}>
        {BIRD_REGION_OPTIONS.map((option) => {
          const active = selected === option.id;
          return (
            <Card
              key={option.id}
              variant="outlined"
              padding="medium"
              style={styles.optionCard}
            >
              <TouchableOpacity
                style={styles.optionRow}
                onPress={() => void selectRegion(option.id)}
                activeOpacity={0.85}
              >
                <Text variant="body" size="medium" weight="medium">
                  {option.label}
                </Text>
                {active ? (
                  <MaterialIcons
                    name="check-circle"
                    size={22}
                    color={theme.colors.primary}
                  />
                ) : (
                  <View style={styles.checkPlaceholder} />
                )}
              </TouchableOpacity>
            </Card>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing[4],
  },
  placeholder: { width: 24 },
  subtitle: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[2],
  },
  content: {
    flex: 1,
    padding: spacing[4],
  },
  optionCard: {
    marginBottom: spacing[2],
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  checkPlaceholder: {
    width: 22,
    height: 22,
  },
});
