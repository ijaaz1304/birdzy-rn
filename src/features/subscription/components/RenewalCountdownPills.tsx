import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { FONTS } from "../../../common/typography";
import { APP_COLORS } from "../../../config/colors";
import { formatCountdownSegment } from "../../../utils";
import { getRemainingRenewalTime } from "../utils/subscriptionStatusDisplay";

type Props = {
  renewalDate: Date;
};

const PILL_BORDER = APP_COLORS.cancelSecondaryBorderLight;
const PILL_TEXT = APP_COLORS.createButtonFg;
const COLON_COLOR = "#888888";

function CountdownSegment({ label }: { label: string }) {
  return (
    <View style={styles.segmentOuter}>
      <Text style={styles.segmentText} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function Colon() {
  return <Text style={styles.colon}>:</Text>;
}

export const RenewalCountdownPills: React.FC<Props> = ({ renewalDate }) => {
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
      <Colon />
      <CountdownSegment
        label={`${formatCountdownSegment(remaining.hours)}hr`}
      />
      <Colon />
      <CountdownSegment
        label={`${formatCountdownSegment(remaining.minutes)}m`}
      />
      <Colon />
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
    borderColor: PILL_BORDER,
    backgroundColor: APP_COLORS.surfaceWhite,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  segmentText: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    lineHeight: 16,
    color: PILL_TEXT,
  },
  colon: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    lineHeight: 16,
    color: COLON_COLOR,
    flexShrink: 0,
  },
});
