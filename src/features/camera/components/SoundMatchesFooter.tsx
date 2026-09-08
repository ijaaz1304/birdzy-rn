import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Text } from "../../../atoms";
import { FONTS } from "../../../common/typography";
import { CAMERA_STRINGS } from "../../../config/strings/camera.strings";
import { Radius } from "../../../design";
import { useTheme } from "../../../hooks/useTheme";

type Props = {
  onSave: () => void;
  onReport: () => void;
  /** When true, cant-find block is rendered elsewhere (e.g. pinned footer). */
  hideCantFind?: boolean;
};

const copy = CAMERA_STRINGS.sound;

export function SoundCantFindSection({
  onSave,
  onReport,
}: Pick<Props, "onSave" | "onReport">) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.cantFind,
        { backgroundColor: theme.colors.surfaceSecondary },
      ]}
    >
      <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
        {copy.cantFindTitle}
      </Text>
      <Text style={[styles.body, { color: theme.colors.textTertiary }]}>
        {copy.cantFindBody}
      </Text>
      <TouchableOpacity
        onPress={onSave}
        activeOpacity={0.85}
        style={[styles.save, { backgroundColor: theme.colors.primaryCTA }]}
      >
        <Text style={styles.saveLabel}>{copy.saveRecording}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onReport} hitSlop={8}>
        <Text style={[styles.report, { color: theme.colors.primaryCTA }]}>
          {copy.reportNoMatches}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export function SoundMatchesFooter({
  onSave,
  onReport,
  hideCantFind = false,
}: Props) {
  if (hideCantFind) return null;

  return <SoundCantFindSection onSave={onSave} onReport={onReport} />;
}

const styles = StyleSheet.create({
  cantFind: {
    marginTop: 8,
    borderRadius: Radius.md,
    padding: 16,
    gap: 8,
    alignItems: "center",
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
  },
  body: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  save: {
    marginTop: 8,
    alignSelf: "stretch",
    height: 44,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  saveLabel: {
    fontFamily: FONTS.medium,
    fontSize: 16,
    lineHeight: 24,
    color: "#FFFFFF",
  },
  report: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
});
