import React from "react";
import { View, StyleSheet, ViewStyle, ScrollView } from "react-native";
import { Tab } from "../Tab";
import { useTheme } from "../../hooks/useTheme";

export interface TabSwitchProps {
  tabs: Array<{ id: string; label: string }>;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  /** When true, tabs are in a horizontal ScrollView (no compression on small screens) */
  scrollable?: boolean;
  /** UI-only overrides (optional) */
  backgroundColor?: string;
  dividerColor?: string;
  containerStyle?: ViewStyle;
  activeTextColor?: string;
  inactiveTextColor?: string;
  underlineColor?: string;
}

export const TabSwitch: React.FC<TabSwitchProps> = ({
  tabs,
  activeTab,
  onTabChange,
  scrollable = false,
  backgroundColor,
  dividerColor,
  containerStyle,
  activeTextColor,
  inactiveTextColor,
  underlineColor,
}) => {
  const theme = useTheme();
  const colors = theme.colors;
  const isDark = theme.mode === "dark";
  const inactiveColor =
    inactiveTextColor ?? (isDark ? colors.textTertiary : colors.textSecondary);

  const tabRow = (
    <View style={[styles.container, scrollable && styles.containerScrollable]}>
      {tabs.map((tab) => (
        <View
          key={tab.id}
          style={scrollable ? styles.tabWrapScrollable : { flex: 1 }}
        >
          <Tab
            label={tab.label}
            active={activeTab === tab.id}
            onPress={() => onTabChange(tab.id)}
            variant="underline"
            size="medium"
            activeColor={activeTextColor}
            inactiveColor={inactiveColor}
            underlineColor={underlineColor}
          />
        </View>
      ))}
    </View>
  );

  return (
    <View
      style={[
        {
          backgroundColor: backgroundColor ?? colors.surfacePrimary,
          borderBottomWidth: 1,
          borderBottomColor: dividerColor ?? colors.border,
        },
        containerStyle,
      ]}
    >
      {scrollable ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {tabRow}
        </ScrollView>
      ) : (
        tabRow
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 48,
    paddingVertical: 4,
  },
  containerScrollable: {
    flexGrow: 0,
  },
  tabWrapScrollable: {
    paddingHorizontal: 12,
  },
  scrollContent: {
    flexGrow: 0,
    alignItems: "center",
  },
});
