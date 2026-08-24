/**
 * App Logs Screen
 * Shows in-app logs (e.g. [AUTH], [IAP], [Subscription]) from useAppLogsStore.
 * Visible in both dev and prod for support and debugging.
 * Copy: single log or all logs. Email: opens composer to APP_LOGS_SUPPORT_EMAIL (full JSON copied if body is truncated).
 */

import React, { useRef, useEffect, useCallback, useState } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity, Linking, Platform, Share } from "react-native";
import { showAlert } from "../../../store/alert.store";
import Clipboard from "@react-native-clipboard/clipboard";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/Ionicons";
import { useTheme } from "../../../hooks/useTheme";
import { UI_COLORS } from "../../../constants/colorConstants";
import { Text, NavBackIcon } from "../../../atoms";
import { useAppLogsStore, AppLog } from "../../app-logs/app-logs.store";
import {
  getIdentifyFlowLogRevision,
  subscribeIdentifyFlowLogs,
} from "../../camera/identifyFlowBuffer";

import { Radius } from "../../../design";

import { spacing } from "../../../design-system/spacing";
import { APP_LOGS_SUPPORT_EMAIL } from "../../../constants/env";

/** mailto: URL length limits vary; keep prefilled body small and rely on clipboard for full JSON. */
const MAILTO_BODY_MAX_CHARS = 1800;

function formatLogLine(log: AppLog): string {
  const meta =
    log.metadata && Object.keys(log.metadata).length > 0
      ? ` ${JSON.stringify(log.metadata, null, 2)}`
      : "";
  return `${log.timestamp} [${log.level.toUpperCase()}] ${log.message}${meta}`;
}

export const AppLogsScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const scrollRef = useRef<ScrollView>(null);
  const { clear, isEnabled, exportLogs, getAllLogsForDisplay } =
    useAppLogsStore();
  const storeLogs = useAppLogsStore((s) => s.logs);
  const [, setIdentifyRevision] = useState(getIdentifyFlowLogRevision());

  useEffect(() => subscribeIdentifyFlowLogs(() => {
    setIdentifyRevision(getIdentifyFlowLogRevision());
  }), []);

  const logs = getAllLogsForDisplay();

  const copyLog = useCallback((log: AppLog) => {
    const text = formatLogLine(log);
    Clipboard.setString(text);
    showAlert("Copied", "Log entry copied to clipboard.");
  }, []);

  const copyAllLogs = useCallback(() => {
    if (logs.length === 0) {
      showAlert("No logs", "There are no logs to copy.");
      return;
    }
    const text = exportLogs();
    Clipboard.setString(text);
    showAlert("Copied", `${logs.length} log(s) copied to clipboard.`);
  }, [logs.length, exportLogs]);

  const sendLogsByEmail = useCallback(async () => {
    if (logs.length === 0) {
      showAlert("No logs", "There are no logs to send.");
      return;
    }
    const json = exportLogs();
    await Clipboard.setString(json);

    const subject = `Birdzy app logs (${logs.length} entries, ${Platform.OS})`;
    const header = `App: Birdzy\nPlatform: ${Platform.OS}\nEntries: ${
      logs.length
    }\nExported: ${new Date().toISOString()}\n\n--- Paste from clipboard if body below is truncated ---\n\n`;
    let bodyForMail = `${header}${json}`;
    let truncated = false;
    if (bodyForMail.length > MAILTO_BODY_MAX_CHARS) {
      truncated = true;
      bodyForMail =
        header +
        json.slice(0, MAILTO_BODY_MAX_CHARS - header.length - 80) +
        "\n…[truncated — full JSON is on the clipboard]…";
    }

    const mailto = `mailto:${APP_LOGS_SUPPORT_EMAIL}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(bodyForMail)}`;

    try {
      const supported = await Linking.canOpenURL(
        `mailto:${APP_LOGS_SUPPORT_EMAIL}`
      ).catch(() => false);
      if (supported) {
        await Linking.openURL(mailto);
        showAlert(
          "Email",
          truncated
            ? `Opening mail to ${APP_LOGS_SUPPORT_EMAIL}. Full log JSON is copied — paste it into the email if needed.`
            : `Opening mail to ${APP_LOGS_SUPPORT_EMAIL}. Log JSON is copied as a backup.`
        );
        return;
      }
    } catch {
      /* fall through to Share */
    }

    try {
      await Share.share({
        title: subject,
        message: json,
      });
      showAlert(
        "Share",
        `Mail could not be opened. Logs are on the clipboard; you can paste into any app. Target: ${APP_LOGS_SUPPORT_EMAIL}`
      );
    } catch {
      showAlert(
        "Logs copied",
        `Could not open mail or share. Full log JSON is on the clipboard. Send to ${APP_LOGS_SUPPORT_EMAIL}.`
      );
    }
  }, [logs.length, exportLogs]);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (logs.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [logs.length, exportLogs, storeLogs.length]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <NavBackIcon color={theme.colors.text} />
        </TouchableOpacity>
        <Text variant="title" size="medium" weight="semibold">
          App Logs
        </Text>
        <View style={styles.headerRight}>
          {logs.length > 0 && (
            <>
              <TouchableOpacity
                onPress={sendLogsByEmail}
                style={styles.copyBtn}
              >
                <Icon name="mail-outline" size={20} color={theme.colors.text} />
              </TouchableOpacity>
              <TouchableOpacity onPress={copyAllLogs} style={styles.copyBtn}>
                <Icon name="copy-outline" size={20} color={theme.colors.text} />
              </TouchableOpacity>
              <TouchableOpacity onPress={clear} style={styles.clearBtn}>
                <Icon
                  name="trash-outline"
                  size={20}
                  color={theme.colors.text}
                />
              </TouchableOpacity>
            </>
          )}
          <View style={styles.placeholder} />
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <Text
          variant="body"
          size="small"
          color="textSecondary"
          style={styles.warning}
        >
          In-app logs for auth, subscription, camera capture, gallery upload, and
          other flows. Master logging is {isEnabled ? "on" : "off"}. Mail sends
          to {APP_LOGS_SUPPORT_EMAIL}. Full JSON is always copied first in case
          the draft truncates. Tap copy on a row for one entry.
        </Text>
        <View
          style={[
            styles.logsContainer,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          {logs.length === 0 ? (
            <Text variant="body" size="small" color="textSecondary">
              No logs yet. Trigger auth or other logged actions to see entries.
            </Text>
          ) : (
            logs.map((log) => (
              <View key={log.id} style={styles.logRow}>
                <Text
                  variant="body"
                  size="small"
                  style={[
                    styles.logEntry,
                    styles[`level_${log.level}` as keyof typeof styles],
                  ]}
                  numberOfLines={10}
                >
                  {new Date(log.timestamp).toLocaleTimeString()} [
                  {log.level.toUpperCase()}] {log.message}
                  {log.metadata &&
                    Object.keys(log.metadata).length > 0 &&
                    ` ${JSON.stringify(log.metadata)}`}
                </Text>
                <TouchableOpacity
                  onPress={() => copyLog(log)}
                  style={styles.copyRowBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Icon
                    name="copy-outline"
                    size={18}
                    color={theme.colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing[4],
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  placeholder: {
    width: 24,
  },
  copyBtn: {
    padding: 4,
    marginRight: 4,
  },
  clearBtn: {
    padding: 4,
    marginRight: 8,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing[4],
    paddingBottom: 32,
  },
  warning: {
    marginBottom: 12,
    fontStyle: "italic",
  },
  logsContainer: {
    padding: spacing[4],
    borderRadius: Radius.sm,
    gap: 8,
  },
  logRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 4,
    gap: 8,
  },
  logEntry: {
    flex: 1,
    fontFamily: "monospace",
    fontSize: 12,
  },
  copyRowBtn: {
    padding: 4,
    marginTop: 2,
  },
  level_debug: { opacity: 0.8 },
  level_info: {},
  // Using standard web console colors for warn/error
  level_warn: { color: UI_COLORS.WARN_AMBER },
  level_error: { color: UI_COLORS.ERROR_RED },
});
