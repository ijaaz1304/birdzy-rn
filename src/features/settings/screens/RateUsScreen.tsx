/**
 * Rate Us Screen
 */

import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../../hooks/useTheme";
import { RateUsModal, FeedbackModal } from "../../../molecules/Modal";
import { useRateUsStore } from "../../rate-us/rate-us.store";
import { sendRatingFeedback } from "../../../services/rating/ratingFeedback.service";
import { useToast } from "../../../hooks";
import { openAppStoreForRating } from "../../../utils/modalHelpers";

export const RateUsScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const { showToast } = useToast();
  const { setHasRated, setHasDeclined } = useRateUsStore();
  const [showRateUsModal, setShowRateUsModal] = useState(true);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [lowRating, setLowRating] = useState<number | undefined>();

  const handleClose = () => {
    setShowRateUsModal(false);
    setHasDeclined(true);
    navigation.goBack();
  };

  const handleLowRating = (rating: number) => {
    setLowRating(rating);
    setShowRateUsModal(false);
    setShowFeedbackModal(true);
  };

  const handleHighRating = async (rating: number) => {
    setHasRated(true);
    setShowRateUsModal(false);

    void sendRatingFeedback({
      domain: "Mushrooms",
      message: "",
      rating,
      source: "rate_us",
    }).catch((error) => {
      console.warn("[RateUs] Failed to send high rating to API", {
        rating,
        error: error?.message ?? String(error),
      });
    });

    await openAppStoreForRating();
    navigation.goBack();
  };

  const handleFeedbackSubmit = async (
    data: {
      name: string;
      email: string;
      feedback: string;
      rating?: number;
    },
    options?: { skipNavigate?: boolean }
  ) => {
    try {
      await sendRatingFeedback({
        domain: "Mushrooms",
        name: data.name || undefined,
        email: data.email || undefined,
        message: data.feedback,
        rating: data.rating,
        source: "rate_us",
      });
      showToast("Thank you for your feedback!", "success");
      setShowFeedbackModal(false);
      setLowRating(undefined);
      if (options?.skipNavigate !== true) {
        navigation.goBack();
      }
    } catch (e) {
      showToast("Failed to send. Please try again.", "error");
    }
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <RateUsModal
        visible={showRateUsModal}
        onClose={handleClose}
        onLowRating={handleLowRating}
        onHighRating={handleHighRating}
      />

      <FeedbackModal
        visible={showFeedbackModal}
        onClose={() => {
          setShowFeedbackModal(false);
          setLowRating(undefined);
          navigation.goBack();
        }}
        onSubmit={handleFeedbackSubmit}
        rating={lowRating}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
