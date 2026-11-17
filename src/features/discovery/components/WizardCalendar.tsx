import React, { useMemo } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { Text } from "../../../atoms";
import { FONTS } from "../../../common/typography";
import { Radius } from "../../../design";
import { useTheme } from "../../../hooks/useTheme";
import {
  WIZARD_WEEKDAY_LABELS,
  WIZARD_WEEKDAY_LABELS_SHORT,
} from "../stepByStep.constants";
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
  const { fontScale } = useWindowDimensions();
  /** Weekday row width: picks 2-letter labels when "Wed" (12pt × font scale) can't fit 1/7 of it */
  /** Card's outer width; the weekday row is that minus the default 20pt padding each side + border */
  const [cardWidth, setCardWidth] = React.useState(0);
  const weekRowWidth = cardWidth > 0 ? cardWidth - 2 * CARD_PADDING_X - 2 : 0;
  const useShortWeekdays =
    weekRowWidth > 0 &&
    weekRowWidth / 7 < WEEKDAY_FULL_LABEL_EM * 12 * fontScale;
  const weekdayLabels = useShortWeekdays
    ? WIZARD_WEEKDAY_LABELS_SHORT
    : WIZARD_WEEKDAY_LABELS;
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
  const weeks = useMemo(
    () =>
      Array.from({ length: cells.length / 7 }, (_, w) =>
        cells.slice(w * 7, w * 7 + 7)
      ),
    [cells]
  );

  const shiftMonth = (delta: number) => {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  };

  return (
    <View
      onLayout={(e) => setCardWidth(e.nativeEvent.layout.width)}
      style={[
        styles.card,
        /* Cramped (2-letter weekdays): less side padding so two-digit dates don't touch */
        useShortWeekdays && styles.cardCompact,
        {
          backgroundColor: theme.colors.surfacePrimary,
          borderColor: theme.colors.border0,
        },
      ]}
    >
      <View style={styles.header}>
        <Text
          style={[styles.month, { color: theme.colors.textPrimary }]}
          numberOfLines={2}
        >
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
        {weekdayLabels.map((label) => (
          <Text
            key={label}
            style={[styles.weekday, { color: theme.colors.textTertiary }]}
            numberOfLines={1}
          >
            {label}
          </Text>
        ))}
      </View>

      {/* One row per week, 7 equal cells: rows never wrap early at large text */}
      <View style={styles.grid}>
        {weeks.map((week, weekIndex) => (
          <View key={`week-${weekIndex}`} style={styles.weekDays}>
            {week.map((iso, index) => {
              if (!iso) {
                return (
                  <View
                    key={`empty-${weekIndex}-${index}`}
                    style={styles.day}
                  />
                );
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
                          color:
                            isSelected || isToday
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
        ))}
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

/** Width of the widest 3-letter label ("Wed") in ems, plus a little breathing room */
const WEEKDAY_FULL_LABEL_EM = 2.2;

const CARD_PADDING_X = 20;
const CARD_PADDING_X_COMPACT = 12;

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: CARD_PADDING_X,
    paddingVertical: 16,
    gap: 20,
  },
  cardCompact: {
    paddingHorizontal: CARD_PADDING_X_COMPACT,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  month: {
    flex: 1,
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
  },
  /** One seventh of the row each (lines up with the day columns), never a fixed width */
  weekday: {
    flex: 1,
    minWidth: 0,
    textAlign: "center",
    fontFamily: FONTS.medium,
    fontSize: 12,
    lineHeight: 16,
  },
  grid: {
    alignSelf: "stretch",
  },
  weekDays: {
    flexDirection: "row",
  },
  /** 44pt tap target that grows with the user's font size (no fixed/max height); 1/7 of the week row */
  day: {
    flex: 1,
    minWidth: 0,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  dayInner: {
    minWidth: 40,
    minHeight: 40,
    maxWidth: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  dayInnerSelected: {
    borderRadius: 999,
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
