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
import type { CardMenuAnchor } from "./AudioGalleryCardMenu";

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
  /** Unknown cards: long-press opens the Rename/Delete menu anchored to this card. */
  onLongPress?: (anchor: CardMenuAnchor) => void;
  /** Card whose menu is open — Figma Border-brand #01474F outline. */
  highlighted?: boolean;
};

type CardBodyProps = Props & { onLongPressBody?: () => void };

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

/**
 * Figma 9380:111722 (dark): play button Surface-brand-1 #16B6B4 with a #091B21 glyph;
 * secondary text Text & icon-Secondary #D1D1D1. Light keeps the existing brown/grey.
 */
const DARK_CARD = {
  playBg: "#16B6B4",
  playGlyph: "#091B21",
  secondaryText: "#D1D1D1",
  /** Figma 9380:111789 "My Recording" tag: Surface-brand-1 Accent + Text & icon-Brand 1. */
  badgeBg: "#072C38",
  badgeText: "#16B6B4",
  /** Figma 9380:111788 highlighted card (menu open): Border-brand. */
  highlightBorder: "#01474F",
} as const;

const PlayButton: React.FC<{
  isPlaying: boolean;
  isDark: boolean;
  onPress: () => void;
}> = ({ isPlaying, isDark, onPress }) => {
  const glyph = isDark ? DARK_CARD.playGlyph : "#FFFFFF";
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      hitSlop={HIT_SLOP.SMALL}
      style={[styles.playBtn, isDark && { backgroundColor: DARK_CARD.playBg }]}
      accessibilityRole="button"
      accessibilityLabel={isPlaying ? "Pause recording" : "Play recording"}
    >
      {isPlaying ? (
        <View style={styles.pauseGlyph}>
          <View style={[styles.pauseBar, { backgroundColor: glyph }]} />
          <View style={[styles.pauseBar, { backgroundColor: glyph }]} />
        </View>
      ) : (
        <SoundLibraryPlayIcon width={24} height={24} color={glyph} />
      )}
    </TouchableOpacity>
  );
};

const CardBody: React.FC<CardBodyProps> = ({
  item,
  variant,
  isPlaying,
  unknownTitle,
  myRecordingLabel,
  matchLabel,
  matchesLabel,
  onPlay,
  onOpen,
  onLongPressBody,
}) => {
  const theme = useTheme();
  const colors = theme.colors;
  const isDark = theme.mode === "dark";
  const secondaryStyle = isDark ? { color: DARK_CARD.secondaryText } : null;
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
          <View
            style={[
              styles.badge,
              isDark && { backgroundColor: DARK_CARD.badgeBg },
            ]}
          >
            <Text
              variant="caption"
              size="small"
              weight="medium"
              numberOfLines={1}
              style={[
                styles.badgeText,
                isDark && { color: DARK_CARD.badgeText },
              ]}
            >
              {myRecordingLabel}
            </Text>
          </View>
        </View>
      ) : (
        // Figma: name + scientific grouped (gap 2); meta sits at the bottom of the 64px row.
        <View style={styles.nameGroup}>
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
              style={[styles.scientific, secondaryStyle]}
            >
              {scientific}
            </Text>
          ) : null}
        </View>
      )}
      {meta ? (
        <Text
          variant="caption"
          size="small"
          numberOfLines={1}
          style={[styles.meta, secondaryStyle]}
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
      {variant === "identified" || onOpen || onLongPressBody ? (
        <TouchableOpacity
          style={styles.identifiedMain}
          onPress={onOpen}
          onLongPress={onLongPressBody}
          delayLongPress={350}
          disabled={!onOpen && !onLongPressBody}
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
                  {
                    backgroundColor: isDark
                      ? colors.surfaceSecondary
                      : APP_COLORS.createButtonBg,
                  },
                ]}
              />
            )
          ) : null}
          {textBlock}
        </TouchableOpacity>
      ) : (
        textBlock
      )}
      <PlayButton isPlaying={isPlaying} isDark={isDark} onPress={onPlay} />
    </View>
  );
};

export const AudioGalleryCard: React.FC<Props> = (props) => {
  const theme = useTheme();
  const swipeRef = useRef<Swipeable>(null);
  const shellRef = useRef<View>(null);
  const borderColor =
    props.highlighted && theme.mode === "dark"
      ? DARK_CARD.highlightBorder
      : props.highlighted
      ? theme.colors.primaryCTA
      : theme.colors.border0;

  const openMenu = props.onLongPress
    ? () => {
        shellRef.current?.measureInWindow((x, y, width, height) => {
          props.onLongPress?.({ x, y, width, height });
        });
      }
    : undefined;
  // Unknown cards used the light pink #F5EBEB even in dark; use the dark surface instead.
  const unknownSurface =
    theme.mode === "dark"
      ? theme.colors.surfacePrimary
      : APP_COLORS.createButtonBg;

  const closeThen = (action?: () => void) => {
    swipeRef.current?.close();
    action?.();
  };

  if (props.variant === "unknown") {
    return (
      <View
        ref={shellRef}
        collapsable={false}
        style={[
          styles.cardShell,
          {
            borderColor,
            backgroundColor: unknownSurface,
          },
        ]}
      >
        <Swipeable
          ref={swipeRef}
          friction={2}
          rightThreshold={40}
          overshootRight={false}
          renderRightActions={() => (
            <View
              style={[
                styles.swipeActions,
                { backgroundColor: unknownSurface },
              ]}
            >
              <TouchableOpacity
                onPress={() => closeThen(props.onEdit)}
                hitSlop={HIT_SLOP.SMALL}
                accessibilityRole="button"
                accessibilityLabel="Edit recording"
              >
                <SoundLibraryEditIcon
                  width={20}
                  height={20}
                  color={
                    theme.mode === "dark"
                      ? DARK_CARD.secondaryText
                      : APP_COLORS.textSecondaryGray
                  }
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
          <CardBody {...props} onLongPressBody={openMenu} />
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
  // Figma: text column fills the row; name group on top, meta at the bottom (min gap 4).
  textCol: {
    flex: 1,
    minWidth: 0,
    alignSelf: "stretch",
    justifyContent: "space-between",
    gap: 4,
  },
  nameGroup: {
    gap: 2,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    flexWrap: "wrap",
  },
  // Figma Body/16px/SemiBold and Caption/12px/Regular (scientific is not italic in Figma).
  commonName: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    lineHeight: 24,
    flexShrink: 1,
  },
  scientific: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    lineHeight: 16,
    color: APP_COLORS.textSecondaryGray,
  },
  meta: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    lineHeight: 16,
    color: APP_COLORS.textSecondaryGray,
  },
  // Figma Tag/Status order: px8 / py4, radius 100, Caption/12px/Medium.
  badge: {
    backgroundColor: APP_COLORS.createButtonBg,
    borderRadius: 100,
    paddingHorizontal: spacing[2],
    paddingVertical: 4,
  },
  badgeText: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    lineHeight: 16,
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
