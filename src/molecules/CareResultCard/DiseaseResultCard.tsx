/**
 * Disease Result Card Component
 * Displays identification results
 */

import { AppImage } from "@/components/AppImage";
import React from "react";
import { View } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { CareResultCard } from "./CareResultCard";
import { Images } from "../../assets";

import { Radius } from "../../design";

export interface DiseaseResultCardProps {
  hasDisease: boolean;
  diseaseName?: string;
  message?: string;
  onDiagnosePress: () => void;
}

export const DiseaseResultCard: React.FC<DiseaseResultCardProps> = ({
  hasDisease,
  diseaseName,
  message,
  onDiagnosePress,
}) => {
  const theme = useTheme();
  const colors = theme.colors;

  const statusMessage =
    message ||
    (hasDisease
      ? `Disease detected: ${diseaseName || "Unknown disease"}`
      : "No issues detected.");

  return (
    <CareResultCard
      icon={
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: Radius.md,
            backgroundColor: colors.surfaceAccentGreen,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <AppImage
            source={Images.modalNotification}
            style={{ width: 16, height: 16 }}
            resizeMode="contain"
          />
        </View>
      }
      title="Identification"
      value={statusMessage}
      status={hasDisease ? "Disease Found" : "Safe"}
      statusColor={hasDisease ? colors.error : colors.success}
      buttonLabel="Identify again"
      buttonColor={colors.reminderFertilising}
      onButtonPress={onDiagnosePress}
    />
  );
};
