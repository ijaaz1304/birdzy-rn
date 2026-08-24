/**
 * Tooltip molecule — iOS-style floating bubble.
 * Arrow points to exact center of trigger; positioning uses measureInWindow.
 */

import React, { useState, useRef, useEffect } from "react";
import { View, TouchableOpacity, StyleSheet, ViewStyle, Modal, TouchableWithoutFeedback, LayoutChangeEvent, Dimensions, Animated } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { Text } from "../../atoms";

const ARROW_SIZE = 9;
const TOOLTIP_SPACING = 12;
const EDGE_PADDING = 10;
const ARROW_CLAMP = 10;
const BUBBLE_RADIUS = 18;
const PADDING_H = 11;
const PADDING_V = 9;

export interface TooltipProps {
  children: React.ReactNode;
  content: string;
  position?: "top" | "bottom" | "left" | "right";
  trigger?: "press" | "longPress";
  disabled?: boolean;
  style?: ViewStyle;
}

export const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  position = "top",
  trigger = "press",
  disabled = false,
  style,
}) => {
  const theme = useTheme();
  const [visible, setVisible] = useState(false);
  const [measuredTooltipLayout, setMeasuredTooltipLayout] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [childLayout, setChildLayout] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const childRef = useRef<View>(null);
  const animOpacity = useRef(new Animated.Value(0)).current;
  const animScale = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    if (!visible) {
      setMeasuredTooltipLayout(null);
      animOpacity.setValue(0);
      animScale.setValue(0.92);
    }
  }, [visible, animOpacity, animScale]);

  useEffect(() => {
    if (visible && measuredTooltipLayout) {
      Animated.parallel([
        Animated.timing(animOpacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.spring(animScale, {
          toValue: 1,
          useNativeDriver: true,
          speed: 14,
          bounciness: 8,
        }),
      ]).start();
    }
  }, [visible, measuredTooltipLayout, animOpacity, animScale]);

  const showTooltip = visible && measuredTooltipLayout !== null;

  const openTooltip = () => {
    childRef.current?.measureInWindow((fx, fy, fwidth, fheight) => {
      setChildLayout({ x: fx, y: fy, width: fwidth, height: fheight });
      setVisible(true);
    });
  };

  const handlePress = () => {
    if (disabled) return;
    if (trigger === "press") {
      if (visible) setVisible(false);
      else openTooltip();
    }
  };

  const handleLongPress = () => {
    if (disabled) return;
    if (trigger === "longPress") openTooltip();
  };

  const handleChildLayout = () => {
    childRef.current?.measureInWindow((fx, fy, fwidth, fheight) => {
      setChildLayout({ x: fx, y: fy, width: fwidth, height: fheight });
    });
  };

  const handleMeasureLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width > 0 && height > 0) setMeasuredTooltipLayout({ width, height });
  };

  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } =
    Dimensions.get("window");
  const tw = measuredTooltipLayout?.width ?? 0;
  const th = measuredTooltipLayout?.height ?? 0;
  const childCenterX = childLayout.x + childLayout.width / 2;
  const childCenterY = childLayout.y + childLayout.height / 2;

  const getTooltipPosition = (): ViewStyle => {
    if (tw <= 0 || th <= 0) {
      return { position: "absolute" as const, left: 0, top: 0, opacity: 0 };
    }

    let left = childCenterX - tw / 2;
    let top = 0;

    switch (position) {
      case "top":
        top = childLayout.y - th - TOOLTIP_SPACING;
        break;
      case "bottom":
        top = childLayout.y + childLayout.height + TOOLTIP_SPACING;
        break;
      case "left":
        left = childLayout.x - tw - TOOLTIP_SPACING;
        top = childCenterY - th / 2;
        break;
      case "right":
        left = childLayout.x + childLayout.width + TOOLTIP_SPACING;
        top = childCenterY - th / 2;
        break;
    }

    left = Math.max(
      EDGE_PADDING,
      Math.min(SCREEN_WIDTH - tw - EDGE_PADDING, left)
    );
    top = Math.max(
      EDGE_PADDING,
      Math.min(SCREEN_HEIGHT - th - EDGE_PADDING, top)
    );

    return { position: "absolute" as const, left, top };
  };

  const getArrowPosition = (): ViewStyle => {
    if (tw <= 0 || th <= 0) {
      return {
        position: "absolute",
        left: 0,
        top: 0,
        width: ARROW_SIZE,
        height: ARROW_SIZE,
      };
    }

    const tooltipLeft = Math.max(
      EDGE_PADDING,
      Math.min(SCREEN_WIDTH - tw - EDGE_PADDING, childCenterX - tw / 2)
    );
    const tooltipTop =
      position === "top"
        ? childLayout.y - th - TOOLTIP_SPACING
        : position === "bottom"
        ? childLayout.y + childLayout.height + TOOLTIP_SPACING
        : childCenterY - th / 2;
    const clampedTooltipTop = Math.max(
      EDGE_PADDING,
      Math.min(SCREEN_HEIGHT - th - EDGE_PADDING, tooltipTop)
    );

    const halfArrow = ARROW_SIZE / 2;

    if (position === "top" || position === "bottom") {
      let arrowLeft = childCenterX - tooltipLeft - halfArrow;
      arrowLeft = Math.max(ARROW_CLAMP, Math.min(arrowLeft, tw - ARROW_CLAMP));
      return {
        position: "absolute" as const,
        left: arrowLeft,
        width: ARROW_SIZE,
        height: ARROW_SIZE,
        backgroundColor: theme.colors.surface,
        borderRadius: 2,
        transform: [{ rotate: "45deg" }],
        ...(position === "top"
          ? { bottom: -halfArrow + 1 }
          : { top: -halfArrow + 1 }),
      };
    }

    let arrowTop = childCenterY - clampedTooltipTop - halfArrow;
    arrowTop = Math.max(ARROW_CLAMP, Math.min(arrowTop, th - ARROW_CLAMP));
    return {
      position: "absolute" as const,
      top: arrowTop,
      width: ARROW_SIZE,
      height: ARROW_SIZE,
      backgroundColor: theme.colors.surface,
      borderRadius: 2,
      transform: [{ rotate: "45deg" }],
      ...(position === "left"
        ? { right: -halfArrow + 1 }
        : { left: -halfArrow + 1 }),
    };
  };

  return (
    <>
      <TouchableOpacity
        ref={childRef}
        onPress={handlePress}
        onLongPress={handleLongPress}
        onLayout={handleChildLayout}
        activeOpacity={0.7}
        disabled={disabled}
        style={style}
      >
        {children}
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setVisible(false)}>
          <View style={styles.modalContainer}>
            {visible && !measuredTooltipLayout && (
              <View
                style={[styles.measureWrap, styles.measureView]}
                onLayout={handleMeasureLayout}
              >
                <Text
                  variant="body"
                  size="small"
                  color="text"
                  style={styles.tooltipText}
                >
                  {content}
                </Text>
              </View>
            )}

            {showTooltip && (
              <Animated.View
                style={[
                  styles.tooltip,
                  {
                    backgroundColor: theme.colors.surface,
                    width: measuredTooltipLayout!.width,
                    height: measuredTooltipLayout!.height,
                    opacity: animOpacity,
                    transform: [{ scale: animScale }],
                    ...theme.shadows.lg,
                  },
                  getTooltipPosition(),
                ]}
              >
                <Text
                  variant="body"
                  size="small"
                  color="text"
                  style={styles.tooltipText}
                >
                  {content}
                </Text>
                <View style={[styles.arrow, getArrowPosition()]} />
              </Animated.View>
            )}
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  measureWrap: {
    paddingHorizontal: PADDING_H,
    paddingVertical: PADDING_V,
    maxWidth: 200,
  },
  measureView: {
    position: "absolute",
    left: -10000,
    top: 0,
    opacity: 0,
    pointerEvents: "none",
  },
  tooltip: {
    paddingHorizontal: PADDING_H,
    paddingVertical: PADDING_V,
    borderRadius: BUBBLE_RADIUS,
    maxWidth: 200,
    zIndex: 10000,
    elevation: 10000,
    overflow: "visible",
  },
  tooltipText: {
    textAlign: "center",
  },
  arrow: {
    position: "absolute",
  },
});
