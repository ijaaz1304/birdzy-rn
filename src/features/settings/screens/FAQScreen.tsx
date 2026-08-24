/**
 * FAQ Screen
 * Accordion-style list with intro and contact email. Matches Support FAQ design.
 */

import React, { useState, useMemo } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { Text, NavBackIcon } from "../../../atoms";
import { useTheme } from "../../../hooks/useTheme";
import { useNavigation } from "@react-navigation/native";
import { SettingsStackParamList } from "../../../navigation/types";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { getFaqStrings } from "../../../config/strings/faq.strings";
import { useAppConfig } from "../../../config/context";
import { spacing } from "../../../design-system/spacing";
import { FONTS } from "../../../common/typography";

type FAQScreenNavigationProp = NativeStackNavigationProp<
  SettingsStackParamList,
  "FAQ"
>;

export const FAQScreen: React.FC = () => {
  const theme = useTheme();
  const colors = theme.colors;
  const { appName } = useAppConfig();
  const faqStrings = useMemo(() => getFaqStrings(appName), [appName]);
  const navigation = useNavigation<FAQScreenNavigationProp>();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggle = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const openEmail = () => {
    Linking.openURL(`mailto:${faqStrings.contactEmail}`);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top", "bottom"]}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <NavBackIcon color={colors.text} />
        </TouchableOpacity>
        <Text
          variant="title"
          size="large"
          weight="bold"
          style={[styles.title, styles.text16Bold]}
        >
          FAQ
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {faqStrings.intro ? (
          <Text
            variant="body"
            size="medium"
            color="textSecondary"
            style={[styles.intro, styles.text16]}
          >
            {faqStrings.intro}
          </Text>
        ) : null}

        {faqStrings.items.map((item) => {
          const isExpanded = expandedId === item.id;
          return (
            <View
              key={item.id}
              style={[styles.itemWrap, { borderBottomColor: colors.border }]}
            >
              <TouchableOpacity
                style={styles.questionRow}
                onPress={() => toggle(item.id)}
                activeOpacity={0.7}
              >
                <Text
                  variant="body"
                  size="medium"
                  weight="semibold"
                  style={[
                    styles.question,
                    styles.text16Bold,
                    { color: colors.text },
                  ]}
                  numberOfLines={isExpanded ? undefined : 2}
                >
                  {item.question}
                </Text>
                <MaterialIcons
                  name={
                    isExpanded ? "keyboard-arrow-up" : "keyboard-arrow-down"
                  }
                  size={24}
                  color={colors.text}
                  style={styles.chevron}
                />
              </TouchableOpacity>
              {isExpanded && (
                <Text
                  variant="body"
                  size="small"
                  color="textSecondary"
                  style={[styles.answer, styles.text14]}
                >
                  {item.answer}
                </Text>
              )}
            </View>
          );
        })}

        <View style={styles.contactWrap}>
          <Text
            variant="body"
            size="small"
            color="textSecondary"
            style={[styles.contactLabel, styles.text14]}
          >
            {faqStrings.contactLabel}
          </Text>
          <TouchableOpacity
            onPress={openEmail}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text
              variant="body"
              size="small"
              color="primary"
              style={[
                styles.contactEmail,
                styles.text14,
                { color: colors.primary },
              ]}
            >
              {faqStrings.contactEmail}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  /** Satoshi 16px – title, intro, questions */
  text16: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    lineHeight: 24,
  },
  text16Bold: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    lineHeight: 24,
  },
  /** Satoshi 14px – answers, contact */
  text14: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    lineHeight: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[4],
    paddingVertical: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  title: { flex: 1, textAlign: "center" },
  placeholder: { width: 44 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: spacing[4], paddingBottom: 32 },
  intro: {
    marginBottom: spacing[5],
  },
  itemWrap: {
    borderBottomWidth: 1,
    paddingVertical: spacing[4],
  },
  questionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  question: {
    flex: 1,
    paddingRight: spacing[2],
  },
  chevron: {
    marginLeft: spacing[2],
  },
  answer: {
    marginTop: spacing[3],
    lineHeight: 20,
  },
  contactWrap: {
    marginTop: spacing[6],
  },
  contactLabel: {
    marginBottom: 4,
  },
  contactEmail: {
    textDecorationLine: "underline",
  },
});
