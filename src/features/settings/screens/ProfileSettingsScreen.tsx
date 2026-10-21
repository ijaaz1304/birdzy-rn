/**
 * My Profile Screen (Figma 7891:186281)
 * Current profile form with an explicit Save action.
 * Email is always read-only (social + email logins).
 */

import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Text } from "../../../atoms";
import { useToast } from "../../../hooks";
import { FONTS } from "../../../common/typography";
import { SETTINGS_STRINGS } from "../../../config/strings/settings.strings";
import { useCountriesStore } from "../../../data/countries.store";
import { useAuthStore } from "../../auth/auth.store";
import { useProfileStore } from "../../profile/profile.store";
import {
  SettingsHeader,
  SettingsTextField,
  SettingsSelectField,
} from "../components";
import { useSettingsColors } from "../settingsColors";

const S = SETTINGS_STRINGS.myProfile;

export const ProfileSettingsScreen: React.FC = () => {
  const c = useSettingsColors();
  const { showToast } = useToast();
  const user = useAuthStore((s) => s.user);
  const { profile, fetchProfile, updateProfile } = useProfileStore();
  const {
    dropdownOptions: countryOptions,
    loading: countriesLoading,
    loadCountries,
  } = useCountriesStore();

  const source = user ?? profile;
  const email = (user?.email ?? profile?.email ?? "").trim();

  const [name, setName] = useState(source?.name?.trim() ?? "");
  const [phone, setPhone] = useState(source?.phone ?? "");
  const [country, setCountry] = useState(source?.country);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
    loadCountries();
  }, [fetchProfile, loadCountries]);

  useEffect(() => {
    if (!profile) return;
    setName(profile.name?.trim() ?? "");
    setPhone(profile.phone ?? "");
    setCountry(profile.country);
  }, [profile]);

  const saveAll = async () => {
    if (saving) return;
    if (phone && !/^\d{10}$/.test(phone)) {
      showToast("Please enter a 10-digit phone number.", "error");
      return;
    }
    setSaving(true);
    try {
      await updateProfile({
        ...(name.trim() ? { name: name.trim() } : {}),
        phone: phone.trim(),
        ...(country ? { country } : {}),
      });
      showToast("Profile saved", "success");
    } catch {
      showToast(S.saveFailed, "error");
    } finally {
      setSaving(false);
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
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.group}>
            <Text style={[styles.groupTitle, { color: c.text }]}>
              {S.personalInformation}
            </Text>
            <SettingsTextField
              label={S.fullName}
              labelTone="primary"
              placeholder={S.fullNamePlaceholder}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              textContentType="name"
            />
          </View>

          <View style={styles.group}>
            <Text style={[styles.groupTitle, { color: c.text }]}>
              {S.contact}
            </Text>
            <SettingsTextField
              label={S.email}
              placeholder={S.emailPlaceholder}
              value={email}
              editable={false}
            />
            <SettingsTextField
              label={S.phone}
              placeholder={S.phonePlaceholder}
              value={phone}
              onChangeText={(value) =>
                setPhone(value.replace(/\D/g, "").slice(0, 10))
              }
              maxLength={10}
              keyboardType="phone-pad"
              textContentType="telephoneNumber"
            />
          </View>

          <SettingsSelectField
            label={S.location}
            placeholder={S.locationPlaceholder}
            options={countryOptions ?? []}
            value={country}
            onSelect={setCountry}
            disabled={countriesLoading}
          />
        </ScrollView>
        <View style={styles.footer}>
          <Button
            title="Save"
            size="large"
            onPress={saveAll}
            fullWidth
            loading={saving}
            disabled={saving}
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
  footer: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
    gap: 24,
  },
  group: {
    gap: 12,
  },
  groupTitle: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    lineHeight: 24,
  },
});
