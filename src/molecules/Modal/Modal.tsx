/**
 * Base Modal component with backdrop
 */

import React, { useEffect } from "react";
import { Modal as RNModal, ModalProps as RNModalProps, StyleSheet, TouchableWithoutFeedback, Animated, ViewStyle } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { OVERLAY_COLORS } from "../../constants/colorConstants";

export interface ModalProps extends Omit<RNModalProps, "style"> {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  animationType?: "fade" | "slide" | "none";
  backdropOpacity?: number;
  backdropColor?: string;
  closeOnBackdropPress?: boolean;
  containerStyle?: ViewStyle;
  contentStyle?: ViewStyle;
  /** Optional name for console logging when overlay opens (dev only). */
  debugName?: string;
}

const EXIT_ANIMATION_DURATION = 220;

export const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  children,
  animationType = "fade",
  backdropOpacity,
  backdropColor,
  closeOnBackdropPress = true,
  containerStyle,
  contentStyle,
  debugName,
  ...props
}) => {
  const _theme = useTheme();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(300)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.96)).current;
  // Keep modal mounted until exit animation completes to avoid fade-out cut-off
  const [modalVisible, setModalVisible] = React.useState(visible);

  useEffect(() => {
    if (visible) {
      setModalVisible(true);
      if (__DEV__) {
        console.log(
          "[Overlay] Modal opened",
          debugName ? `: ${debugName}` : ""
        );
      }
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
        animationType === "slide"
          ? Animated.spring(slideAnim, {
              toValue: 0,
              tension: 65,
              friction: 11,
              useNativeDriver: true,
            })
          : Animated.timing(slideAnim, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
        animationType === "fade"
          ? Animated.timing(scaleAnim, {
              toValue: 1,
              duration: 280,
              useNativeDriver: true,
            })
          : Animated.timing(scaleAnim, {
              toValue: 1,
              duration: 0,
              useNativeDriver: true,
            }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: EXIT_ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 300,
          duration: EXIT_ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.96,
          duration: EXIT_ANIMATION_DURATION,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) {
          setModalVisible(false);
        }
      });
    }
  }, [visible, fadeAnim, slideAnim, scaleAnim, animationType]);

  const overlayColor = backdropColor ?? OVERLAY_COLORS.MODAL_BACKDROP;
  const overlayOpacity = backdropOpacity ?? 1;

  return (
    <RNModal
      visible={modalVisible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
      presentationStyle="overFullScreen"
      {...props}
    >
      <TouchableWithoutFeedback
        onPress={closeOnBackdropPress ? onClose : undefined}
      >
        <Animated.View
          style={[
            styles.backdrop,
            {
              backgroundColor: overlayColor,
              opacity: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, overlayOpacity],
              }),
              zIndex: 9998,
              elevation: 9998,
            },
            containerStyle,
          ]}
        >
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <Animated.View
              style={[
                styles.content,
                {
                  zIndex: 1000,
                  elevation: 24,
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
                },
                contentStyle,
              ]}
            >
              {children}
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    width: "90%",
    maxWidth: 400,
    alignSelf: "center",
  },
});
