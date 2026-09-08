import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { SoundLibraryEditIcon } from "../../../assets";
import { Text } from "../../../atoms";
import { FONTS } from "../../../common/typography";
import { Radius } from "../../../design";
import { useTheme } from "../../../hooks/useTheme";
import type { WizardAnswerRow } from "../utils/stepByStepAnswers";
import type { WizardQuestion } from "../stepByStep.types";

export function WizardSectionDivider() {
  const theme = useTheme();
  return (
    <View
      style={[styles.divider, { backgroundColor: theme.colors.border0 }]}
    />
  );
}

type Props = {
  rows: WizardAnswerRow[];
  editLabel: string;
  cantFindTitle: string;
  cantFindBody: string;
  addManuallyLabel: string;
  reportLabel: string;
  answersTitle: string;
  answersSubtitle: string;
  onEdit: (question: WizardQuestion) => void;
  onAddManually: () => void;
  onReport: () => void;
  /** When true, cant-find block is rendered elsewhere (e.g. pinned footer). */
  hideCantFind?: boolean;
};

export function WizardCantFindSection({
  cantFindTitle,
  cantFindBody,
  addManuallyLabel,
  reportLabel,
  onAddManually,
  onReport,
}: Pick<
  Props,
  | "cantFindTitle"
  | "cantFindBody"
  | "addManuallyLabel"
  | "reportLabel"
  | "onAddManually"
  | "onReport"
>) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.cantFind,
        { backgroundColor: theme.colors.surfaceSecondary },
      ]}
    >
      <Text style={[styles.cantFindTitle, { color: theme.colors.textPrimary }]}>
        {cantFindTitle}
      </Text>
      <Text
        style={[styles.cantFindBody, { color: theme.colors.textSecondary }]}
      >
        {cantFindBody}
      </Text>
      <TouchableOpacity
        onPress={onAddManually}
        activeOpacity={0.85}
        style={[
          styles.addButton,
          { backgroundColor: theme.colors.primaryCTA },
        ]}
      >
        <Text style={styles.addButtonLabel}>{addManuallyLabel}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onReport} hitSlop={8} style={styles.reportWrap}>
        <Text style={[styles.report, { color: theme.colors.primaryCTA }]}>
          {reportLabel}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export function WizardAnswersFooter({
  rows,
  editLabel,
  cantFindTitle,
  cantFindBody,
  addManuallyLabel,
  reportLabel,
  answersTitle,
  answersSubtitle,
  onEdit,
  onAddManually,
  onReport,
  hideCantFind = false,
}: Props) {
  const theme = useTheme();

  return (
    <View style={styles.wrap}>
      <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
        {answersTitle}
      </Text>
      <Text
        style={[styles.sectionSubtitle, { color: theme.colors.textTertiary }]}
      >
        {answersSubtitle}
      </Text>

      <View style={styles.rows}>
        {rows.map((row) => (
          <View
            key={row.question}
            style={[
              styles.answerCard,
              {
                backgroundColor: theme.colors.surfacePrimary,
                borderColor: theme.colors.border0,
              },
            ]}
          >
            <View
              style={[
                styles.number,
                { backgroundColor: theme.colors.surfaceSecondary },
              ]}
            >
              <Text
                style={[styles.numberLabel, { color: theme.colors.textPrimary }]}
              >
                {row.number}
              </Text>
            </View>
            <View style={styles.answerCopy}>
              <Text
                style={[
                  styles.answerTitle,
                  { color: theme.colors.textTertiary },
                ]}
              >
                {row.title}
              </Text>
              <View style={styles.answerValueRow}>
                {row.colorHex ? (
                  <View
                    style={[
                      styles.colorDot,
                      {
                        backgroundColor: row.colorHex,
                        borderColor: theme.colors.border0,
                      },
                    ]}
                  />
                ) : null}
                <Text
                  style={[
                    styles.answerValue,
                    { color: theme.colors.textPrimary },
                  ]}
                  numberOfLines={2}
                >
                  {row.value}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.edit}
              onPress={() => onEdit(row.question)}
              hitSlop={8}
            >
              <Text
                style={[styles.editLabel, { color: theme.colors.primaryCTA }]}
              >
                {editLabel}
              </Text>
              <SoundLibraryEditIcon
                width={16}
                height={16}
                color={theme.colors.primaryCTA}
              />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {hideCantFind ? null : (
        <WizardCantFindSection
          cantFindTitle={cantFindTitle}
          cantFindBody={cantFindBody}
          addManuallyLabel={addManuallyLabel}
          reportLabel={reportLabel}
          onAddManually={onAddManually}
          onReport={onReport}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  divider: {
    height: StyleSheet.hairlineWidth,
    width: "100%",
    marginTop: 24,
    marginBottom: 8,
  },
  wrap: {
    paddingTop: 16,
    gap: 8,
  },
  sectionTitle: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    lineHeight: 24,
  },
  sectionSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  rows: {
    gap: 8,
  },
  answerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: 12,
  },
  number: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  numberLabel: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  answerCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  answerTitle: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    lineHeight: 16,
  },
  answerValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  colorDot: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1,
  },
  answerValue: {
    flex: 1,
    fontFamily: FONTS.medium,
    fontSize: 16,
    lineHeight: 24,
  },
  edit: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  editLabel: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  cantFind: {
    marginTop: 16,
    borderRadius: Radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 16,
    gap: 8,
    alignItems: "stretch",
  },
  cantFindTitle: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    lineHeight: 24,
  },
  cantFindBody: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: -0.16,
  },
  addButton: {
    marginTop: 8,
    alignSelf: "stretch",
    height: 48,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonLabel: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    lineHeight: 16,
    color: "#FFFFFF",
  },
  reportWrap: {
    alignSelf: "center",
    paddingVertical: 8,
  },
  report: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    lineHeight: 16,
  },
});
