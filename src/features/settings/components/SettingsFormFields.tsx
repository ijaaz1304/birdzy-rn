/**
 * Settings form fields (Figma "Textfield" / "Textarea"):
 * Body/14px/Medium label, 8px gap, 48px pill field (or 100px / r12 text area),
 * Body/16px/Regular value.
 */

import React from "react";
import { View, StyleSheet, TextInput, TextInputProps } from "react-native";
import { Text } from "../../../atoms";
import { Dropdown, DropdownOption } from "../../../molecules/Dropdown/Dropdown";
import { FONTS } from "../../../common/typography";
import { useSettingsColors } from "../settingsColors";

const FIELD_HEIGHT = 48;
const PILL_RADIUS = 360;

type LabelTone = "primary" | "secondary";

function FieldLabel({ label, tone }: { label: string; tone: LabelTone }) {
  const c = useSettingsColors();
  return (
    <Text
      style={[styles.label, { color: tone === "primary" ? c.text : c.label }]}
    >
      {label}
    </Text>
  );
}

export interface SettingsTextFieldProps
  extends Omit<TextInputProps, "style" | "placeholderTextColor"> {
  label: string;
  labelTone?: LabelTone;
  placeholderColor?: string;
  style?: TextInputProps["style"];
  containerStyle?: object;
}

export const SettingsTextField: React.FC<SettingsTextFieldProps> = ({
  label,
  labelTone = "secondary",
  placeholderColor,
  style,
  containerStyle,
  editable = true,
  ...inputProps
}) => {
  const c = useSettingsColors();
  return (
    <View style={[styles.field, containerStyle]}>
      <FieldLabel label={label} tone={labelTone} />
      <TextInput
        {...inputProps}
        editable={editable}
        placeholderTextColor={placeholderColor ?? c.muted}
        style={[
          styles.input,
          {
            color: c.text,
            borderColor: c.fieldBorder,
            backgroundColor: c.fieldBg,
            opacity: editable ? 1 : 0.7,
          },
          style,
        ]}
      />
    </View>
  );
};

export const SettingsTextArea: React.FC<SettingsTextFieldProps> = (props) => (
  <SettingsTextField
    multiline
    textAlignVertical="top"
    {...props}
    style={[styles.textArea, props.style]}
  />
);

export interface SettingsSelectFieldProps {
  label: string;
  labelTone?: LabelTone;
  options: DropdownOption[];
  value?: string;
  placeholder: string;
  onSelect: (value: string) => void;
  disabled?: boolean;
  rightIcon?: React.ReactNode;
  containerStyle?: object;
}

export const SettingsSelectField: React.FC<SettingsSelectFieldProps> = ({
  label,
  labelTone = "secondary",
  containerStyle,
  ...dropdownProps
}) => {
  const c = useSettingsColors();
  return (
    <View style={[styles.field, containerStyle]}>
      <FieldLabel label={label} tone={labelTone} />
      <Dropdown
        {...dropdownProps}
        height={FIELD_HEIGHT}
        borderRadius={PILL_RADIUS}
        buttonBackgroundColor={c.fieldBg}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  field: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    lineHeight: 20,
  },
  input: {
    height: FIELD_HEIGHT,
    borderWidth: 1,
    borderRadius: PILL_RADIUS,
    paddingHorizontal: 16,
    paddingVertical: 0,
    fontSize: 16,
    fontFamily: FONTS.regular,
    letterSpacing: -0.16,
  },
  textArea: {
    height: 100,
    borderRadius: 12,
    paddingTop: 10,
    paddingBottom: 10,
    lineHeight: 24,
  },
});
