/**
 * Post-auth onboarding permission slides (location + notifications).
 * Same title / hero / body / CTA layout so screen 1 and 2 match.
 */

import { AppImage } from "@/components/AppImage";
import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
  type ImageSourcePropType,
} from "react-native";
import { Images } from "../../../assets";
import { FONTS } from "../../../common/typography";
import { useStrings } from "../../../hooks/useStrings";
import { Text } from "../../../atoms";
import { POST_AUTH_LAYOUT } from "../constants";
import { usePostAuthLayoutMetrics } from "../utils/postAuthLayout";

type PostAuthLocationAccessSlideProps = {
  onContinue: () => void;
  continueLoading?: boolean;
  textPrimary: string;
  primaryColor: string;
  onPrimaryColor: string;
  title?: string;
  subtitle?: string;
  image?: ImageSourcePropType;
  continueLabel?: string;
};

export const PostAuthLocationAccessSlide: React.FC<
  PostAuthLocationAccessSlideProps
> = ({
  onContinue,
  continueLoading = false,
  textPrimary,
  primaryColor,
  onPrimaryColor,
  title,
  subtitle,
  image,
  continueLabel,
}) => {
  const strings = useStrings();
  const layout = usePostAuthLayoutMetrics();
  const copy = strings.camera.galleryLocationAccess;
  const heading = title ?? copy.title;
  const body = subtitle ?? copy.subtitle;
  const cta = continueLabel ?? copy.continue;
  const hero = image ?? Images.locationPost;

  return (
    <View style={styles.root}>
      <View
        style={[
          styles.mainContent,
          { paddingTop: layout.contentTopPadding },
        ]}
      >
        <Text
          variant="title"
          size="small"
          weight="semibold"
          style={[styles.title, { color: textPrimary }]}
        >
          {heading}
        </Text>

        <View
          style={[
            styles.heroWrap,
            { marginTop: layout.titleToHeroGap },
          ]}
        >
          <AppImage
            source={hero}
            style={styles.heroImage}
            resizeMode="contain"
          />
        </View>

        <Text
          style={[
            styles.body,
            {
              color: textPrimary,
              marginTop: layout.heroImageMarginBottom,
            },
          ]}
        >
          {body}
        </Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: primaryColor }]}
          onPress={onContinue}
          disabled={continueLoading}
          activeOpacity={0.85}
        >
          {continueLoading ? (
            <ActivityIndicator color={onPrimaryColor} size="small" />
          ) : (
            <Text
              variant="body"
              size="medium"
              weight="medium"
              style={{ color: onPrimaryColor }}
            >
              {cta}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    minHeight: 0,
  },
  mainContent: {
    flex: 1,
    minHeight: 0,
    paddingHorizontal: POST_AUTH_LAYOUT.horizontalPadding,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  title: {
    textAlign: "center",
    fontSize: 20,
    lineHeight: 28,
    width: POST_AUTH_LAYOUT.contentWidth,
    maxWidth: "100%",
    flexShrink: 0,
  },
  heroWrap: {
    flex: 1,
    width: "100%",
    minHeight: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  heroImage: {
    width: POST_AUTH_LAYOUT.contentWidth,
    maxWidth: "100%",
    height: "100%",
  },
  body: {
    textAlign: "center",
    fontFamily: FONTS.medium,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: -0.16,
    width: POST_AUTH_LAYOUT.contentWidth,
    maxWidth: "100%",
    marginBottom: 8,
    flexShrink: 0,
  },
  footer: {
    width: "100%",
    paddingHorizontal: POST_AUTH_LAYOUT.horizontalPadding,
    paddingTop: 16,
    paddingBottom: 4,
    alignItems: "center",
    gap: 12,
    flexShrink: 0,
  },
  primaryButton: {
    width: POST_AUTH_LAYOUT.contentWidth,
    maxWidth: "100%",
    height: POST_AUTH_LAYOUT.ctaHeight,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
});
