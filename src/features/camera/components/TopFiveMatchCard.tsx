import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { AppImage, CachedRemoteImage } from "../../../components/AppImage";
import { Text } from "../../../atoms/Text";
import { Images } from "../../../assets";
import { FONTS } from "../../../common/typography";
import { useIsDark, useTheme } from "../../../hooks/useTheme";
import DetailsLight from "../../../assets/identification/figma/details-light.svg";
import DetailsDark from "../../../assets/identification/figma/details-dark.svg";
import StarLight from "../../../assets/identification/figma/star-light.svg";
import StarDark from "../../../assets/identification/figma/star-dark.svg";

type Props = {
  accessory?: React.ReactNode;
  name: string;
  scientificName?: string;
  imageUri?: string | null;
  wishlisted: boolean;
  onPress: () => void;
  onWishlistPress: () => void;
};
export function TopFiveMatchCard({
  accessory,
  name,
  scientificName,
  imageUri,
  wishlisted,
  onPress,
  onWishlistPress,
}: Props) {
  const { colors } = useTheme();
  const isDark = useIsDark();
  const uri = imageUri?.trim();
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [uri]);
  const Details = isDark ? DetailsDark : DetailsLight;
  const Star = isDark ? StarDark : StarLight;
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surfacePrimary, borderColor: colors.border0 },
      ]}
    >
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Open photo details for ${name}`}
      >
        {uri && !failed ? (
          <CachedRemoteImage
            uri={uri}
            style={styles.photo}
            resizeMode="cover"
            onError={() => setFailed(true)}
          />
        ) : (
          <View
            style={[
              styles.photo,
              styles.empty,
              { backgroundColor: colors.surfaceSecondary },
            ]}
          >
            <Text style={{ color: colors.textSecondary }}>No image</Text>
          </View>
        )}
      </Pressable>
      <View style={styles.body}>
        <View style={styles.names}>
          <Text style={[styles.name, { color: colors.textPrimary }]}>
            {name}
          </Text>
          {scientificName ? (
            <Text style={[styles.scientific, { color: colors.textSecondary }]}>
              {scientificName}
            </Text>
          ) : null}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`View details for ${name}`}
          onPress={onPress}
          style={[
            styles.details,
            { backgroundColor: isDark ? "#16B6B4" : "#785284" },
          ]}
        >
          <Text
            style={[
              styles.detailsText,
              { color: isDark ? "#091B21" : "#FFFFFF" },
            ]}
          >
            View Details
          </Text>
          <View style={styles.icon}>
            <Details />
          </View>
        </Pressable>
        {accessory}
      </View>
      <Pressable
        onPress={onWishlistPress}
        accessibilityRole="button"
        accessibilityLabel={`${wishlisted ? "Remove" : "Add"} ${name} ${
          wishlisted ? "from" : "to"
        } wishlist`}
        accessibilityState={{ selected: wishlisted }}
        style={styles.star}
        hitSlop={4}
      >
        {wishlisted ? (
          <AppImage
            source={Images.wishlistStarFilled}
            style={styles.selectedStar}
            resizeMode="contain"
          />
        ) : (
          <Star />
        )}
      </Pressable>
    </View>
  );
}
const styles = StyleSheet.create({
  card: {
    minHeight: 124,
    borderRadius: 12,
    borderWidth: 1,
    padding: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 16,
  },
  photo: { width: 100, height: 100, borderRadius: 8 },
  empty: { alignItems: "center", justifyContent: "center" },
  body: { flex: 1, minWidth: 0, gap: 12 },
  names: { paddingRight: 28, gap: 2 },
  name: { fontFamily: FONTS.bold, fontSize: 16, lineHeight: 24 },
  scientific: { fontFamily: FONTS.regular, fontSize: 12, lineHeight: 16 },
  details: {
    minHeight: 32,
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-end",
    maxWidth: "100%",
    gap: 4,
  },
  detailsText: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    lineHeight: 20,
    flexShrink: 1,
  },
  icon: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  star: {
    position: "absolute",
    top: 11,
    right: 11,
    width: 32,
    height: 32,
    borderRadius: 100,
    backgroundColor: "#FFFFFF33",
    alignItems: "center",
    justifyContent: "center",
  },
  selectedStar: { width: 20, height: 20 },
});
