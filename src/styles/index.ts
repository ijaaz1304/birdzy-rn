/**
 * Styles exports
 * Central export point for all styles
 */

import { StyleSheet } from "react-native";
// Legacy style helpers
export const createStyles = StyleSheet.create;

// Re-export StyleSheet for backward compatibility
export { StyleSheet } from "react-native";

// Common styles
export * from "./common";
