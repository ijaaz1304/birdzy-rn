/**
 * Profile Settings Screen — view-only profile details from settings.
 */

import React, { useEffect } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Avatar, Text, NavBackIcon } from "../../../atoms";
import { useTheme } from "../../../hooks/useTheme";
import { useAuthStore } from "../../auth/auth.store";
import { useProfileStore } from "../../profile/profile.store";
import { SETTINGS_STRINGS } from "../../../config/strings/settings.strings";
import { spacing } from "../../../design-system/spacing";
import { APP_COLORS } from "../../../config/colors";

function ProfileField({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: ReturnType<typeof useTheme>["colors"];
}) {
  return (
    <View
      style={[
        styles.fieldCard,
        {
          backgroundColor: colors.surfacePrimary,
          borderColor: colors.border,
        },
      ]}
    >
      <Text variant="body" size="small" color="textSecondary">
        {label}
      </Text>
      <Text
        variant="body"
        size="medium"
        weight="medium"
        style={styles.fieldValue}
      >
        {value}
      </Text>
    </View>
  );
}

export const ProfileSettingsScreen: React.FC = () => {
  const theme = useTheme();
  const colors = theme.colors;
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const { profile, fetchProfile } = useProfileStore();

  const displayName = user?.name ?? profile?.name ?? "—";
  const displayEmail = user?.email ?? profile?.email ?? "—";
  const displayBio =
    (profile as { bio?: string } | null)?.bio?.trim() ||
    SETTINGS_STRINGS.profile.bioEmpty;
  const avatarUri = user?.avatar ?? profile?.avatar;

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <NavBackIcon color={colors.textPrimary} />
        </TouchableOpacity>
        <Text
          variant="title"
          size="large"
          weight="bold"
          style={styles.headerTitle}
        >
          {SETTINGS_STRINGS.profile.title}
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.avatarSection}>
          <Avatar
            name={displayName !== "—" ? displayName : undefined}
            source={avatarUri}
            size={120}
            style={{
              borderWidth: 1,
              borderColor: APP_COLORS.borderGray,
              backgroundColor: colors.surfaceVariant,
            }}
          />
        </View>

        <ProfileField
          label={SETTINGS_STRINGS.profile.name}
          value={displayName}
          colors={colors}
        />
        <ProfileField
          label={SETTINGS_STRINGS.profile.email}
          value={displayEmail}
          colors={colors}
        />
        <ProfileField
          label={SETTINGS_STRINGS.profile.bio}
          value={displayBio}
          colors={colors}
        />
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
  },
  headerRight: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing[4],
    gap: spacing[4],
    paddingBottom: spacing[8],
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: spacing[2],
  },
  fieldCard: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    gap: spacing[1],
  },
  fieldValue: {
    lineHeight: 22,
  },
});
