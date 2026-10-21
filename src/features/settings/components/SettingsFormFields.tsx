/**
 * Settings form fields (Figma "Textfield" / "Textarea"):
 * Body/14px/Medium label, 8px gap, 48px pill field (or 100px / r12 text area),
 * Body/16px/Regular value.
 */

import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  TextInputProps,
  TouchableOpacity,
} from "react-native";
import { Text } from "../../../atoms";
import { Dropdown, DropdownOption } from "../../../molecules/Dropdown/Dropdown";
import { FONTS } from "../../../common/typography";
import SubjectChevron from "../../../assets/icons/settings/subject-chevron.svg";
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
  inlineMenu?: boolean;
  containerStyle?: object;
}

export const SettingsSelectField: React.FC<SettingsSelectFieldProps> = ({
  label,
  labelTone = "secondary",
  containerStyle,
  inlineMenu = false,
  ...dropdownProps
}) => {
  const c = useSettingsColors();
  const [open, setOpen] = useState(false);
  const selected = dropdownProps.options.find(
    (option) => option.value === dropdownProps.value
  );
  if (inlineMenu) {
    return (
      <View style={[styles.field, containerStyle]}>
        <FieldLabel label={label} tone={labelTone} />
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={label}
          accessibilityState={{
            expanded: open,
            disabled: dropdownProps.disabled,
          }}
          disabled={dropdownProps.disabled}
          onPress={() => setOpen((value) => !value)}
          style={[
            styles.selectButton,
            { borderColor: c.fieldBorder, backgroundColor: c.fieldBg },
          ]}
        >
          <Text style={[styles.selectValue, { color: c.text }]}>
            {selected?.label ?? dropdownProps.placeholder}
          </Text>
          <View
            style={[
              styles.selectIcon,
              { transform: [{ rotate: open ? "-90deg" : "90deg" }] },
            ]}
          >
            <SubjectChevron color={c.text} />
          </View>
        </TouchableOpacity>
        {open && (
          <View
            style={[
              styles.menu,
              { borderColor: c.fieldBorder, backgroundColor: c.fieldBg },
            ]}
          >
            {dropdownProps.options.map((option, index) => {
              const highlighted = selected
                ? selected.value === option.value
                : index === 0;
              return (
                <TouchableOpacity
                  key={option.value}
                  accessibilityRole="button"
                  accessibilityState={{
                    selected: selected?.value === option.value,
                    disabled: option.disabled,
                  }}
                  disabled={option.disabled}
                  onPress={() => {
                    dropdownProps.onSelect(option.value);
                    setOpen(false);
                  }}
                  style={[
                    styles.menuOption,
                    highlighted && { backgroundColor: c.cardBorder },
                  ]}
                >
                  <Text
                    style={[
                      styles.menuText,
                      {
                        color: highlighted ? c.text : c.label,
                        fontFamily: highlighted ? FONTS.medium : FONTS.regular,
                      },
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    );
  }
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
  selectButton: {
    height: FIELD_HEIGHT,
    borderWidth: 1,
    borderRadius: PILL_RADIUS,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  selectValue: {
    flex: 1,
    fontSize: 16,
    fontFamily: FONTS.regular,
    lineHeight: 24,
    letterSpacing: -0.16,
  },
  selectIcon: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  menu: {
    borderWidth: 1,
    borderRadius: 8,
    gap: 4,
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  menuOption: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  menuText: { fontSize: 14, lineHeight: 20 },
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
