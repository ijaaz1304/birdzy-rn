import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { FONTS } from "../../../common/typography";
import { APP_COLORS } from "../../../config/colors";
import { formatCountdownSegment } from "../../../utils";
import { getRemainingRenewalTime } from "../utils/subscriptionStatusDisplay";

type Props = {
  renewalDate: Date;
  textPrimary: string;
};

const CHIP_BORDER = "rgba(199, 99, 12, 0.4)";
const CHIP_GRADIENT = ["#C7630C", "#DA9838"] as const;
const CHIP_GRADIENT_LOCATIONS = [0.122, 0.975] as const;
const CHIP_GRADIENT_START = { x: 0.08, y: 1 };
const CHIP_GRADIENT_END = { x: 0.92, y: 0.05 };

function CountdownSegment({ label }: { label: string }) {
  return (
    <View style={styles.segmentOuter}>
      <LinearGradient
        colors={[...CHIP_GRADIENT]}
        locations={[...CHIP_GRADIENT_LOCATIONS]}
        start={CHIP_GRADIENT_START}
        end={CHIP_GRADIENT_END}
        style={StyleSheet.absoluteFillObject}
      />
      <Text style={styles.segmentText} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function Colon({ color }: { color: string }) {
  return <Text style={[styles.colon, { color }]}>:</Text>;
}

export const RenewalCountdownPills: React.FC<Props> = ({
  renewalDate,
  textPrimary,
}) => {
  const [remaining, setRemaining] = useState(() =>
    getRemainingRenewalTime(renewalDate)
  );

  useEffect(() => {
    const tick = () => setRemaining(getRemainingRenewalTime(renewalDate));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [renewalDate]);

  const dayLabel = remaining.days === 1 ? "1 day" : `${remaining.days} days`;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      bounces={false}
    >
      <CountdownSegment label={dayLabel} />
      <Colon color={textPrimary} />
      <CountdownSegment
        label={`${formatCountdownSegment(remaining.hours)}hr`}
      />
      <Colon color={textPrimary} />
      <CountdownSegment
        label={`${formatCountdownSegment(remaining.minutes)}m`}
      />
      <Colon color={textPrimary} />
      <CountdownSegment
        label={`${formatCountdownSegment(remaining.seconds)}s`}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexGrow: 1,
    gap: 8,
  },
  segmentOuter: {
    height: 28,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: CHIP_BORDER,
    overflow: "hidden",
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  segmentText: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    lineHeight: 16,
    color: APP_COLORS.modalTextOnPrimary,
  },
  colon: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    lineHeight: 16,
    flexShrink: 0,
  },
});
