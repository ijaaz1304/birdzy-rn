import React from "react";
import { StyleSheet, View } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

/** Figma tab-atom — gradient pill with premium icon beside locked detail tabs. */
export function DetailsTabPremiumBadge() {
  return (
    <LinearGradient
      colors={["#41EDE9", "#219699", "#0F7A81", "#9E70B6"]}
      locations={[0.075, 0.139, 0.176, 0.931]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.badge}
    >
      <MaterialIcons name="workspace-premium" size={12} color="#FFFFFF" />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  badge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginLeft: 8,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
});
