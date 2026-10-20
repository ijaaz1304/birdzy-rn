/**
 * Contact Us Screen (Figma 7884:134822)
 * Subject topic + message, sent through the support feedback endpoint.
 */

import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Button } from "../../../atoms";
import { useToast } from "../../../hooks";
import { SETTINGS_STRINGS } from "../../../config/strings/settings.strings";
import { sendRatingFeedback } from "../../../services/rating/ratingFeedback.service";
import { useAuthStore } from "../../auth/auth.store";
import {
  SettingsHeader,
  SettingsIcon,
  SettingsSelectField,
  SettingsTextArea,
} from "../components";
import { useSettingsColors } from "../settingsColors";

const S = SETTINGS_STRINGS.contactUs;
const TOPICS = [...S.topics];

export const ContactUsScreen: React.FC = () => {
  const c = useSettingsColors();
  const navigation = useNavigation();
  const { showToast } = useToast();
  const user = useAuthStore((s) => s.user);
  const [topic, setTopic] = useState<string | undefined>();
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const canSend = !!topic && message.trim().length > 0 && !sending;

  const handleSend = async () => {
    if (!canSend) return;
    const topicLabel = TOPICS.find((t) => t.value === topic)?.label ?? topic;
    setSending(true);
    try {
      await sendRatingFeedback({
        domain: "Mushrooms",
        name: user?.isGuest ? undefined : user?.name,
        email: user?.isGuest ? undefined : user?.email,
        message: `${topicLabel} - ${message.trim()}`,
        source: "contact_us",
      });
      showToast(S.sent, "success");
      navigation.goBack();
    } catch {
      showToast(S.failed, "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: c.screen }]}
      edges={["top", "bottom"]}
    >
      <SettingsHeader title={S.title} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <SettingsSelectField
            label={S.subject}
            labelTone="primary"
            placeholder={S.subjectPlaceholder}
            options={TOPICS}
            value={topic}
            onSelect={setTopic}
            rightIcon={<SettingsIcon name="chevronRightLg" color={c.text} />}
          />
          <SettingsTextArea
            label={S.message}
            labelTone="primary"
            placeholder={S.messagePlaceholder}
            placeholderColor={c.placeholder}
            value={message}
            onChangeText={setMessage}
          />
        </ScrollView>
        <View style={styles.footer}>
          <Button
            title={S.send}
            variant="primary"
            size="large"
            fullWidth
            onPress={handleSend}
            disabled={!canSend}
            loading={sending}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
    gap: 16,
  },
  footer: {
    paddingHorizontal: 19,
    paddingTop: 8,
    paddingBottom: 8,
  },
});
