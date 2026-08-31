import React, { useMemo } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { Text } from "../../../atoms";
import { FONTS } from "../../../common/typography";
import { Radius } from "../../../design";
import { useTheme } from "../../../hooks/useTheme";
import { WIZARD_WEEKDAY_LABELS } from "../stepByStep.constants";
import {
  formatWizardMonthYear,
  isoDateToday,
  toIsoDate,
} from "../utils/stepByStepAnswers";

type Props = {
  selectedIso: string | null;
  onSelect: (iso: string) => void;
  onResetToday: () => void;
  resetLabel: string;
};

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

export function WizardCalendar({
  selectedIso,
  onSelect,
  onResetToday,
  resetLabel,
}: Props) {
  const theme = useTheme();
  const todayIso = isoDateToday();
  const selected = selectedIso ?? todayIso;
  const selectedDate = useMemo(() => {
    const [y, m, d] = selected.split("-").map(Number);
    return new Date(y, (m ?? 1) - 1, d ?? 1);
  }, [selected]);
  const [viewYear, setViewYear] = React.useState(selectedDate.getFullYear());
  const [viewMonth, setViewMonth] = React.useState(selectedDate.getMonth());

  React.useEffect(() => {
    setViewYear(selectedDate.getFullYear());
    setViewMonth(selectedDate.getMonth());
  }, [selectedDate]);

  const cells = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1);
    const startPad = first.getDay();
    const count = daysInMonth(viewYear, viewMonth);
    const total = Math.ceil((startPad + count) / 7) * 7;
    return Array.from({ length: total }, (_, index) => {
      const day = index - startPad + 1;
      if (day < 1 || day > count) return null;
      return toIsoDate(new Date(viewYear, viewMonth, day));
    });
  }, [viewMonth, viewYear]);

  const shiftMonth = (delta: number) => {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surfacePrimary,
          borderColor: theme.colors.border0,
        },
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.month, { color: theme.colors.textPrimary }]}>
          {formatWizardMonthYear(viewYear, viewMonth)}
        </Text>
        <View style={styles.arrows}>
          <TouchableOpacity onPress={() => shiftMonth(-1)} hitSlop={8}>
            <MaterialIcons
              name="chevron-left"
              size={24}
              color={theme.colors.textPrimary}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => shiftMonth(1)} hitSlop={8}>
            <MaterialIcons
              name="chevron-right"
              size={24}
              color={theme.colors.textPrimary}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.weekRow}>
        {WIZARD_WEEKDAY_LABELS.map((label) => (
          <Text
            key={label}
            style={[styles.weekday, { color: theme.colors.textTertiary }]}
          >
            {label}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((iso, index) => {
          if (!iso) {
            return <View key={`empty-${index}`} style={styles.day} />;
          }
          const isSelected = iso === selected;
          const isToday = iso === todayIso;
          const dayNumber = Number(iso.slice(-2));
          return (
            <TouchableOpacity
              key={iso}
              style={styles.day}
              onPress={() => onSelect(iso)}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.dayInner,
                  isSelected && styles.dayInnerSelected,
                  isSelected && {
                    backgroundColor: `${theme.colors.primaryCTA}22`,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.dayLabel,
                    {
                      color: isSelected || isToday
                        ? theme.colors.primaryCTA
                        : theme.colors.textPrimary,
                      fontFamily:
                        isSelected || isToday ? FONTS.bold : FONTS.regular,
                    },
                  ]}
                >
                  {dayNumber}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <View
        style={[styles.divider, { backgroundColor: theme.colors.border0 }]}
      />
      <TouchableOpacity onPress={onResetToday} style={styles.reset}>
        <Text style={[styles.resetLabel, { color: theme.colors.textPrimary }]}>
          {resetLabel}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  month: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    lineHeight: 24,
  },
  arrows: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  weekday: {
    width: 32,
    textAlign: "center",
    fontFamily: FONTS.medium,
    fontSize: 12,
    lineHeight: 16,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  day: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    maxHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  dayInner: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  dayInnerSelected: {
    borderRadius: 22,
  },
  dayLabel: {
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: -0.16,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    width: "100%",
  },
  reset: {
    alignItems: "center",
    paddingVertical: 8,
  },
  resetLabel: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    lineHeight: 20,
  },
});
