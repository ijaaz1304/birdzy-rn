import { SettingsHeader } from "../components/SettingsHeader";
import FaqChevron from "../../../assets/icons/settings/faq-chevron.svg";
/**
 * FAQ Screen
 * Accordion-style list with intro and contact email. Matches Support FAQ design.
 */

import React, { useState, useMemo } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "../../../atoms";
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
      <SettingsHeader title="FAQs" onBackPress={() => navigation.goBack()} />

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
                accessibilityRole="button"
                accessibilityState={{ expanded: isExpanded }}
                onPress={() => toggle(item.id)}
                activeOpacity={0.7}
              >
                <Text
                  variant="body"
                  size="medium"
                  weight="bold"
                  style={[
                    styles.question,
                    styles.text16Bold,
                    { color: colors.text },
                  ]}
                >
                  {item.question}
                </Text>
                <View
                  style={[styles.chevron, isExpanded && styles.chevronOpen]}
                >
                  <FaqChevron color={colors.textPrimary} />
                </View>
              </TouchableOpacity>
              {isExpanded && (
                <Text
                  variant="body"
                  size="small"
                  color="textSecondary"
                  style={[
                    styles.answer,
                    styles.text16,
                    { color: colors.textPrimary },
                  ]}
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
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 32 },
  intro: {
    marginBottom: spacing[5],
  },
  itemWrap: {
    borderBottomWidth: 1,
    paddingVertical: 0,
  },
  questionRow: {
    paddingVertical: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  question: {
    flex: 1,
    paddingRight: spacing[2],
  },
  chevronOpen: { transform: [{ rotate: "180deg" }] },
  chevron: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: spacing[2],
  },
  answer: {
    paddingBottom: 24,
    lineHeight: 24,
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
