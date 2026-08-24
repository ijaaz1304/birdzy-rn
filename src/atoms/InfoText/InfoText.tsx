import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { InfoTextProps } from "../../types/ui";
import { Text } from "../Text";
import { useTheme } from "../../hooks/useTheme";

const decodeHtmlEntities = (input: string): string => {
  return input
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_m, num) => {
      const code = Number(num);
      return Number.isFinite(code) ? String.fromCharCode(code) : _m;
    });
};

const htmlToPlainText = (input: string): string => {
  // Quick heuristic: only transform when it looks like HTML.
  if (!/[<>]/.test(input)) return decodeHtmlEntities(input);

  let text = input;
  text = text.replace(/<br\s*\/?>/gi, "\n");
  text = text.replace(/<\/p>/gi, "\n\n").replace(/<p[^>]*>/gi, "");
  text = text.replace(/<\/div>/gi, "\n").replace(/<div[^>]*>/gi, "");
  text = text.replace(/<\/li>/gi, "\n").replace(/<li[^>]*>/gi, "- ");
  text = text.replace(/<\/ul>/gi, "\n").replace(/<ul[^>]*>/gi, "");
  text = text.replace(/<\/ol>/gi, "\n").replace(/<ol[^>]*>/gi, "");
  text = text.replace(/<[^>]+>/g, "");
  text = decodeHtmlEntities(text);
  text = text.replace(/\n{3,}/g, "\n\n").trim();
  return text;
};

export const InfoText = ({
  text,
  linkText,
  onLinkPress,
  variant = "default",
}: InfoTextProps) => {
  const theme = useTheme();
  const _colors = theme.colors;
  const displayText = typeof text === "string" ? htmlToPlainText(text) : text;
  const textColor =
    variant === "primary" ? "primary" : ("textSecondary" as const);

  return (
    <View style={styles.container}>
      <Text color={textColor} style={styles.text}>
        {displayText}
      </Text>
      {linkText && (
        <TouchableOpacity onPress={onLinkPress} activeOpacity={0.7}>
          <Text color="primary">{linkText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  text: {
    lineHeight: undefined, // Let Text component handle line height automatically
    flex: 1,
  },
});
