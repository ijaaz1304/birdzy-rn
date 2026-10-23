import { AppImage } from "@/components/AppImage";
import React, { useRef } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import {
  SoundLibraryDeleteIcon,
  SoundLibraryEditIcon,
  SoundLibraryPlayIcon,
} from "../../../assets";
import { Text } from "../../../atoms";
import { FONTS } from "../../../common/typography";
import { APP_COLORS } from "../../../config/colors";
import { HIT_SLOP } from "../../../constants/uiConstants";
import { Radius } from "../../../design";
import { spacing } from "../../../design-system/spacing";
import { useTheme } from "../../../hooks/useTheme";
import type { BirdGalleryAudioFile } from "../../../services/api/features/bird.api.types";

export type AudioGalleryCardVariant = "identified" | "unknown";

type Props = {
  item: BirdGalleryAudioFile;
  variant: AudioGalleryCardVariant;
  isPlaying: boolean;
  unknownTitle: string;
  myRecordingLabel: string;
  matchLabel: string;
  matchesLabel: string;
  onPlay: () => void;
  onOpen?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
};

export function getClipTimestamp(item: BirdGalleryAudioFile): number {
  const raw = item.createdAt || item.capturedAt;
  if (!raw) return 0;
  const t = Date.parse(raw);
  return Number.isNaN(t) ? 0 : t;
}

export function clipDisplayName(
  item: BirdGalleryAudioFile,
  variant: AudioGalleryCardVariant,
  unknownTitle: string
): string {
  if (variant === "unknown") {
    return item.specimen?.commonName || unknownTitle;
  }
  return (
    item.specimen?.commonName ||
    item.specimen?.scientificName ||
    unknownTitle
  );
}

function formatClipDate(item: BirdGalleryAudioFile): string | undefined {
  const t = getClipTimestamp(item);
  if (!t) return undefined;
  const d = new Date(t);
  const month = d.toLocaleString("en-US", { month: "short" });
  const day = d.getDate();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${month} ${day}, ${hh}:${mm}`;
}

export function formatClipMeta(
  item: BirdGalleryAudioFile,
  options: {
    includeMatches?: boolean;
    matchLabel: string;
    matchesLabel: string;
  }
): string {
  const parts: string[] = [];
  const date = formatClipDate(item);
  if (date) parts.push(date);
  if (item.locationString) parts.push(item.locationString);
  if (options.includeMatches && item.resultsCount != null) {
    const label =
      item.resultsCount === 1 ? options.matchLabel : options.matchesLabel;
    parts.push(`${item.resultsCount} ${label}`);
  }
  return parts.join(" • ");
}

const PlayButton: React.FC<{ isPlaying: boolean; onPress: () => void }> = ({
  isPlaying,
  onPress,
}) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.85}
    hitSlop={HIT_SLOP.SMALL}
    style={[styles.playBtn]}
    accessibilityRole="button"
    accessibilityLabel={isPlaying ? "Pause recording" : "Play recording"}
  >
    {isPlaying ? (
      <View style={styles.pauseGlyph}>
        <View style={styles.pauseBar} />
        <View style={styles.pauseBar} />
      </View>
    ) : (
      <SoundLibraryPlayIcon width={24} height={24} color="#FFFFFF" />
    )}
  </TouchableOpacity>
);

const CardBody: React.FC<Props> = ({
  item,
  variant,
  isPlaying,
  unknownTitle,
  myRecordingLabel,
  matchLabel,
  matchesLabel,
  onPlay,
  onOpen,
}) => {
  const theme = useTheme();
  const colors = theme.colors;
  const imageUrl =
    item.specimen?.defaultImageUrl || item.specimen?.imageUrls?.[0];
  const common = item.specimen?.commonName;
  const scientificName = item.specimen?.scientificName;
  const title =
    variant === "unknown"
      ? common || unknownTitle
      : common || scientificName || unknownTitle;
  const scientific =
    variant === "identified" && common ? scientificName : undefined;
  const meta = formatClipMeta(item, {
    includeMatches: variant === "unknown",
    matchLabel,
    matchesLabel,
  });

  const textBlock = (
    <View style={styles.textCol}>
      {variant === "unknown" ? (
        <View style={styles.titleRow}>
          <Text
            variant="body"
            size="medium"
            weight="bold"
            numberOfLines={1}
            style={[styles.commonName, { color: colors.textPrimary }]}
          >
            {title}
          </Text>
          <View style={styles.badge}>
            <Text
              variant="caption"
              size="small"
              weight="medium"
              numberOfLines={1}
              style={styles.badgeText}
            >
              {myRecordingLabel}
            </Text>
          </View>
        </View>
      ) : (
        <>
          <Text
            variant="body"
            size="medium"
            weight="bold"
            numberOfLines={1}
            style={[styles.commonName, { color: colors.textPrimary }]}
          >
            {title}
          </Text>
          {scientific ? (
            <Text
              variant="caption"
              size="small"
              numberOfLines={1}
              style={styles.scientific}
            >
              {scientific}
            </Text>
          ) : null}
        </>
      )}
      {meta ? (
        <Text
          variant="caption"
          size="small"
          numberOfLines={1}
          style={styles.meta}
        >
          {meta}
        </Text>
      ) : null}
    </View>
  );

  return (
    <View
      style={[
        styles.cardInner,
        { backgroundColor: colors.surfacePrimary },
      ]}
    >
      {variant === "identified" || onOpen ? (
        <TouchableOpacity
          style={styles.identifiedMain}
          onPress={onOpen}
          disabled={!onOpen}
          activeOpacity={onOpen ? 0.85 : 1}
        >
          {variant === "identified" ? (
            imageUrl ? (
              <AppImage
                source={{ uri: imageUrl }}
                style={styles.thumb}
                resizeMode="cover"
              />
            ) : (
              <View
                style={[
                  styles.thumb,
                  { backgroundColor: APP_COLORS.createButtonBg },
                ]}
              />
            )
          ) : null}
          {textBlock}
        </TouchableOpacity>
      ) : (
        textBlock
      )}
      <PlayButton isPlaying={isPlaying} onPress={onPlay} />
    </View>
  );
};

export const AudioGalleryCard: React.FC<Props> = (props) => {
  const theme = useTheme();
  const swipeRef = useRef<Swipeable>(null);
  const borderColor = theme.colors.border0;

  const closeThen = (action?: () => void) => {
    swipeRef.current?.close();
    action?.();
  };

  if (props.variant === "unknown") {
    return (
      <View
        style={[
          styles.cardShell,
          {
            borderColor,
            backgroundColor: APP_COLORS.createButtonBg,
          },
        ]}
      >
        <Swipeable
          ref={swipeRef}
          friction={2}
          rightThreshold={40}
          overshootRight={false}
          renderRightActions={() => (
            <View style={styles.swipeActions}>
              <TouchableOpacity
                onPress={() => closeThen(props.onEdit)}
                hitSlop={HIT_SLOP.SMALL}
                accessibilityRole="button"
                accessibilityLabel="Edit recording"
              >
                <SoundLibraryEditIcon
                  width={20}
                  height={20}
                  color={APP_COLORS.textSecondaryGray}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => closeThen(props.onDelete)}
                hitSlop={HIT_SLOP.SMALL}
                accessibilityRole="button"
                accessibilityLabel="Delete recording"
              >
                <SoundLibraryDeleteIcon width={20} height={20} />
              </TouchableOpacity>
            </View>
          )}
        >
          <CardBody {...props} />
        </Swipeable>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.cardShell,
        {
          borderColor,
          backgroundColor: theme.colors.surfacePrimary,
        },
      ]}
    >
      <CardBody {...props} />
    </View>
  );
};

const styles = StyleSheet.create({
  cardShell: {
    borderWidth: 1,
    borderRadius: Radius.md,
    overflow: "hidden",
  },
  cardInner: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing[3],
    gap: spacing[3],
  },
  identifiedMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    minWidth: 0,
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: Radius.md,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    flexWrap: "wrap",
  },
  commonName: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    flexShrink: 1,
  },
  scientific: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    fontStyle: "italic",
    color: APP_COLORS.textSecondaryGray,
  },
  meta: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: APP_COLORS.textSecondaryGray,
  },
  badge: {
    backgroundColor: APP_COLORS.createButtonBg,
    borderRadius: 100,
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
  },
  badgeText: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    color: APP_COLORS.createButtonFg,
  },
  playBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: APP_COLORS.createButtonFg,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    overflow: "hidden",
  },
  pauseGlyph: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  pauseBar: {
    width: 4,
    height: 14,
    borderRadius: 1,
    backgroundColor: "#FFFFFF",
  },
  swipeActions: {
    width: 40,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: spacing[2],
    backgroundColor: APP_COLORS.createButtonBg,
  },
});
