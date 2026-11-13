import { useCallback, useState } from "react";
import type {
  NativeSyntheticEvent,
  TextLayoutEventData,
  TextStyle,
} from "react-native";

/**
 * Sizes a Text to the lines Android actually draws.
 *
 * React Native's Android text measurement counts a line's trailing space, so a
 * line that only just fits is measured as wrapping while it is drawn on one
 * line → an empty line appears under the text at some font/display sizes.
 * `onTextLayout` reports the drawn lines; summing their heights fixes the box.
 * It re-runs whenever the text re-wraps (font scale, display size, width), so
 * genuine wrapping still grows the text.
 *
 * Usage: `const drawn = useDrawnTextHeight();`
 *        `<Text style={[styles.title, drawn.style]} onTextLayout={drawn.onTextLayout}>`
 */
export function useDrawnTextHeight() {
  const [height, setHeight] = useState<number | null>(null);

  const onTextLayout = useCallback(
    (e: NativeSyntheticEvent<TextLayoutEventData>) => {
      const sum = e.nativeEvent.lines.reduce((h, line) => h + line.height, 0);
      const next = sum > 0 ? Math.ceil(sum) : null;
      setHeight((prev) => (prev === next ? prev : next));
    },
    []
  );

  const style: TextStyle | null = height != null ? { height } : null;
  return { onTextLayout, style };
}
