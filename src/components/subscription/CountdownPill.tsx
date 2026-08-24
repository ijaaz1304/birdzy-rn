/**
 * Countdown Pill Component
 * Reusable countdown timer pill for subscription screens. Prefix from config.
 */

import React, { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { Text } from "../../atoms";
import { subscriptionConfig } from "../../config/subscriptionConfig";
import { formatCountdownSegment } from "../../utils";
import { OVERLAY_COLORS } from "../../constants/colorConstants";

interface CountdownPillProps {
  prefix?: string;
  initialCountdown?: { hours: number; minutes: number; seconds: number };
  onComplete?: () => void;
}

export const CountdownPill: React.FC<CountdownPillProps> = ({
  prefix = subscriptionConfig.countdownPrefix,
  initialCountdown = subscriptionConfig.countdownDuration,
  onComplete,
}) => {
  const theme = useTheme();
  const _colors = theme.colors;
  const spacing = theme.spacing;
  const radius = theme.radius;

  const [countdown, setCountdown] = useState(initialCountdown);

  useEffect(() => {
    let lastUpdate = Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastUpdate >= 1000) {
        setCountdown((prev) => {
          let { hours, minutes, seconds } = prev;

          if (seconds > 0) {
            seconds--;
          } else if (minutes > 0) {
            minutes--;
            seconds = 59;
          } else if (hours > 0) {
            hours--;
            minutes = 59;
            seconds = 59;
          } else {
            clearInterval(interval);
            onComplete?.();
            return { hours: 0, minutes: 0, seconds: 0 };
          }

          return { hours, minutes, seconds };
        });
        lastUpdate = now;
      }
    }, 100);

    return () => clearInterval(interval);
  }, [onComplete]);

  const timeString = `${formatCountdownSegment(
    countdown.hours
  )}:${formatCountdownSegment(countdown.minutes)}:${formatCountdownSegment(
    countdown.seconds
  )}`;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: OVERLAY_COLORS.COUNTDOWN_PILL_BG,
          borderRadius: radius.lg,
          paddingHorizontal: spacing[3],
          paddingVertical: spacing[2],
        },
      ]}
    >
      <Text
        variant="body"
        size="small"
        weight="semibold"
        style={{ color: OVERLAY_COLORS.COUNTDOWN_PILL_TEXT }}
      >
        {prefix} {timeString}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: "flex-start",
  },
});
