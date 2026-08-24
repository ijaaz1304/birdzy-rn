/**
 * Animated waveform bars for sound identify UI (draft spectrogram-style).
 */

import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { spacing } from "../../../design-system/spacing";

const BAR_COUNT = 24;

type Props = {
  active: boolean;
  color: string;
  height?: number;
};

export const SoundWaveformBars: React.FC<Props> = ({
  active,
  color,
  height = 48,
}) => {
  const anims = useRef(
    Array.from({ length: BAR_COUNT }, () => new Animated.Value(0.25))
  ).current;

  useEffect(() => {
    if (!active) {
      anims.forEach((a) => a.setValue(0.2));
      return;
    }
    const loops = anims.map((anim, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 0.35 + Math.random() * 0.65,
            duration: 180 + (i % 5) * 40,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0.15 + Math.random() * 0.35,
            duration: 180 + (i % 7) * 30,
            useNativeDriver: true,
          }),
        ])
      )
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [active, anims]);

  return (
    <View style={[styles.row, { height }]}>
      {anims.map((anim, i) => (
        <Animated.View
          key={i}
          style={[
            styles.bar,
            {
              backgroundColor: color,
              transform: [{ scaleY: anim }],
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    width: "100%",
    paddingHorizontal: spacing[4],
  },
  bar: {
    flex: 1,
    height: "100%",
    borderRadius: 2,
    minWidth: 3,
  },
});
