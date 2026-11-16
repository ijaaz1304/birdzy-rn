import { useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Keyboard,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
} from "react-native";

/**
 * Share of the window assumed covered by the keyboard when Android reports no usable height.
 * With edge-to-edge (RN 0.81, `edgeToEdgeEnabled=true`) the window never resizes and
 * `Keyboard` events report a wrong height (seen: -24, and 275 for a ~328pt keyboard). Measured Gboard: 37–41% of the window on
 * the test devices; 45% keeps a margin.
 */
export const ANDROID_KEYBOARD_FALLBACK_SHARE = 0.45;

type Box = { y: number; h: number; parent?: string };

/**
 * Keyboard rule (responsiveness doc): keep the focused field AND the form's CTA visible.
 *
 * Usage:
 * - spread `scrollViewProps` on the form's ScrollView and add `contentPaddingBottom` to its content;
 * - wrap each field in a View with `onLayout={layout("email")}` (pass a parent key when the field
 *   sits inside another tracked View: `layout("email", "fields")`);
 * - wrap the CTA in a View with `onLayout={layout("cta")}`;
 * - give each input `onFocus={focus("email")}`.
 *
 * When the keyboard opens, focus moves or the layout changes (errors appearing), the form scrolls
 * down just enough to reveal the CTA — never so far that the focused field's top leaves the view.
 * On iOS the screen's KeyboardAvoidingView shrinks the layout; on Android (edge-to-edge) the hook
 * adds bottom room equal to the keyboard overlap so the content can scroll above it.
 *
 * @param bottomInsetWhenOpen space between the scroll view and the window bottom while the keyboard
 *   is open (the page's bottom padding), subtracted from the overlap.
 */
export function useKeyboardAwareForm(bottomInsetWhenOpen = 8) {
  const scrollRef = useRef<ScrollView>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardOverlap, setKeyboardOverlap] = useState(0);
  const kbVisible = useRef(false);
  const overlapRef = useRef(0);
  const viewportH = useRef(0);
  const scrollY = useRef(0);
  const boxes = useRef<Record<string, Box>>({});
  const focusKey = useRef<string | null>(null);

  const absY = (key: string) => {
    let y = 0;
    let b: Box | undefined = boxes.current[key];
    let guard = 0;
    while (b && guard++ < 10) {
      y += b.y;
      b = b.parent ? boxes.current[b.parent] : undefined;
    }
    return y;
  };

  const reveal = useCallback(() => {
    const key = focusKey.current;
    const cta = boxes.current.cta;
    if (
      !kbVisible.current ||
      !key ||
      !boxes.current[key] ||
      !cta ||
      !viewportH.current
    )
      return;
    const visible = Math.max(0, viewportH.current - overlapRef.current);
    const ctaBottom = absY("cta") + cta.h;
    const target = Math.min(ctaBottom + 8 - visible, absY(key) - 8);
    if (target > scrollY.current + 1) {
      scrollRef.current?.scrollTo({ y: target, animated: true });
    }
  }, []);

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvent, (e) => {
      kbVisible.current = true;
      setKeyboardVisible(true);
      let overlap = 0;
      if (Platform.OS === "android") {
        const reported = e?.endCoordinates?.height ?? 0;
        // Reported heights are unreliable here (seen: -24, and 275 for a real ~328pt keyboard),
        // so never use less than the conservative estimate.
        const kbH = Math.max(
          reported,
          Dimensions.get("window").height * ANDROID_KEYBOARD_FALLBACK_SHARE
        );
        overlap = Math.max(0, kbH - bottomInsetWhenOpen);
      }
      overlapRef.current = overlap;
      setKeyboardOverlap(overlap);
      setTimeout(reveal, 150);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      kbVisible.current = false;
      overlapRef.current = 0;
      setKeyboardOverlap(0);
      setKeyboardVisible(false);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [bottomInsetWhenOpen, reveal]);

  const layout = useCallback(
    (key: string, parent?: string) => (e: LayoutChangeEvent) => {
      const l = e.nativeEvent.layout;
      boxes.current[key] = { y: l.y, h: l.height, parent };
      // Errors appearing while typing move the CTA — keep it revealed.
      reveal();
    },
    [reveal]
  );

  const focus = useCallback(
    (key: string) => () => {
      focusKey.current = key;
      setTimeout(reveal, 120);
    },
    [reveal]
  );

  const scrollViewProps = {
    ref: scrollRef,
    onLayout: (e: LayoutChangeEvent) => {
      viewportH.current = e.nativeEvent.layout.height;
      reveal();
    },
    onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollY.current = e.nativeEvent.contentOffset.y;
    },
    scrollEventThrottle: 16,
    keyboardShouldPersistTaps: "handled" as const,
  };

  return {
    scrollViewProps,
    keyboardVisible,
    /** Add to the scroll content's bottom padding while the keyboard is open (Android). */
    contentPaddingBottom: keyboardOverlap,
    layout,
    focus,
  };
}
