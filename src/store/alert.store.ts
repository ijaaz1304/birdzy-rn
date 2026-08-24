/**
 * Global alert modal store
 * Use showAlert() instead of Alert.alert() for consistent in-app popups (same style as Delete Account).
 */

import { create } from "zustand";

export interface AlertButton {
  text: string;
  onPress?: () => void;
}

export type AlertIconVariant = "info" | "success";

export interface AlertOptions {
  title: string;
  message: string;
  primary: AlertButton;
  secondary?: AlertButton;
  /** When true, the modal does not show the icon circle. */
  hideIcon?: boolean;
  /** When true, primary and secondary buttons use CTA colors (e.g. for Discard/Cancel). */
  useCtaStyle?: boolean;
  /** Icon above the title; defaults to success tick when title is "Success". */
  iconVariant?: AlertIconVariant;
}

interface AlertState {
  visible: boolean;
  title: string;
  message: string;
  primary: AlertButton;
  secondary: AlertButton | null;
  hideIcon: boolean;
  useCtaStyle: boolean;
  iconVariant: AlertIconVariant;
  show: (opts: AlertOptions) => void;
  hide: () => void;
}

const defaultButton: AlertButton = { text: "OK", onPress: () => {} };

export const useAlertStore = create<AlertState>((set) => ({
  visible: false,
  title: "",
  message: "",
  primary: defaultButton,
  secondary: null,
  hideIcon: false,
  useCtaStyle: false,
  iconVariant: "info",
  show: (opts) =>
    set({
      visible: true,
      title: opts.title,
      message: opts.message,
      primary: opts.primary,
      secondary: opts.secondary ?? null,
      hideIcon: opts.hideIcon ?? false,
      useCtaStyle: opts.useCtaStyle ?? false,
      iconVariant:
        opts.iconVariant ??
        (opts.title.trim().toLowerCase() === "success" ? "success" : "info"),
    }),
  hide: () =>
    set({
      visible: false,
      title: "",
      message: "",
      primary: defaultButton,
      secondary: null,
      hideIcon: false,
      useCtaStyle: false,
      iconVariant: "info",
    }),
}));

/**
 * Show an in-app alert (replaces Alert.alert).
 * Same visual style as Delete Account confirmation modal.
 */
export function showAlert(
  title: string,
  message: string,
  options?: {
    primaryText?: string;
    onPrimary?: () => void;
    secondaryText?: string;
    onSecondary?: () => void;
    hideIcon?: boolean;
    useCtaStyle?: boolean;
    iconVariant?: AlertIconVariant;
  }
): void {
  const primaryText = options?.primaryText ?? "OK";
  const onPrimary = options?.onPrimary;
  useAlertStore.getState().show({
    title,
    message,
    primary: { text: primaryText, onPress: onPrimary },
    secondary:
      options?.secondaryText != null
        ? { text: options.secondaryText, onPress: options?.onSecondary }
        : undefined,
    hideIcon: options?.hideIcon,
    useCtaStyle: options?.useCtaStyle,
    iconVariant: options?.iconVariant,
  });
}
