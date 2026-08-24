import { AppImage } from "@/components/AppImage";
import React from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "../../atoms";
import { Images } from "../../assets";
import { Radius } from "../../design";

const DEFAULT_WARNING =
  "This mushroom may be toxic, deadly, or psychoactive. Avoid consuming it. Handle with caution and consult a local expert for accurate identification.";

export function getMushroomWarningTitle(
  edibility?: string | null,
  toxicitySeverity?: string | null,
  psychoactive?: string | null
): string | null {
  const isToxic =
    edibility === "toxic" ||
    edibility === "deadly" ||
    (toxicitySeverity != null && toxicitySeverity !== "none");
  const isPsychoactive = psychoactive === "yes";
  if (isToxic && isPsychoactive) return "Potentially Toxic / Psychoactive";
  if (isToxic) return "Potentially Toxic";
  if (isPsychoactive) return "Psychoactive";
  if (edibility === "inedible") return "Inedible";
  return null;
}

export function shouldShowMushroomWarning(
  edibility?: string | null,
  toxicitySeverity?: string | null,
  psychoactive?: string | null,
  warningBanner?: string | null
): boolean {
  const banner =
    warningBanner && warningBanner !== "null" ? warningBanner.trim() : "";
  if (banner) return true;
  return (
    getMushroomWarningTitle(edibility, toxicitySeverity, psychoactive) != null
  );
}

interface MushroomWarningBannerProps {
  edibility?: string | null;
  toxicitySeverity?: string | null;
  psychoactive?: string | null;
  warningBanner?: string | null;
  isDark?: boolean;
}

export const MushroomWarningBanner: React.FC<MushroomWarningBannerProps> = ({
  edibility,
  toxicitySeverity,
  psychoactive,
  warningBanner,
  isDark = false,
}) => {
  const title = getMushroomWarningTitle(
    edibility,
    toxicitySeverity,
    psychoactive
  );
  const customBanner =
    warningBanner && warningBanner !== "null" ? warningBanner.trim() : "";
  if (!title && !customBanner) return null;

  const message = customBanner || DEFAULT_WARNING;

  return (
    <View style={styles.wrapper}>
      <View style={[styles.banner, isDark && styles.bannerDark]}>
        <AppImage
          source={Images.informationCircle}
          style={styles.infoIcon}
          resizeMode="contain"
        />
        <Text variant="body" size="medium" style={styles.message}>
          <Text variant="body" size="medium" weight="medium">
            Warning
          </Text>
          : {message}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 12,
    width: "100%",
  },
  banner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 12,
    borderRadius: Radius.md,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  bannerDark: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
  },
  infoIcon: {
    width: 20,
    height: 20,
    marginTop: 2,
  },
  message: {
    flex: 1,
    lineHeight: 24,
  },
});
