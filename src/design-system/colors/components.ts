/**
 * Bird App — Component color tokens
 *
 * Maps semantic tokens to UI roles: Button, Input, Card, Tab, Badge, Navigation, Modal.
 * Primitive → Semantic → Component → UI
 */

import {
  SEMANTIC_DARK,
  SEMANTIC_LIGHT,
  type ThemeSemantic,
} from "./semantic";

function buildComponentTokens(semantic: ThemeSemantic) {
  const { content, border, surface } = semantic;

  return {
    button: {
      primary: {
        background: surface.brand1,
        text: content.inverse,
        border: border.brand,
      },
      secondary: {
        background: surface.secondary,
        text: content.primary,
        border: border.primary,
      },
      ghost: {
        background: "transparent",
        text: content.brand1,
        border: border.brand2,
      },
      destructive: {
        background: surface.error,
        text: content.error,
        border: border.error,
      },
      disabled: {
        background: surface.disabled,
        text: content.disabled,
        border: border.primary,
      },
    },
    input: {
      background: surface.primary,
      text: content.primary,
      placeholder: content.tertiary,
      border: border.primary,
      borderFocused: border.brand,
      borderError: border.error,
    },
    card: {
      background: surface.primary,
      border: border.zero,
      title: content.primary,
      subtitle: content.secondary,
      muted: content.tertiary,
    },
    tab: {
      active: content.primary,
      inactive: content.tertiary,
      indicator: content.brand1,
      background: surface.secondary,
    },
    badge: {
      brand: {
        background: surface.brand1Accent,
        text: content.brand1,
      },
      success: {
        background: surface.success,
        text: content.success,
      },
      warning: {
        background: surface.warning,
        text: content.warning,
      },
      error: {
        background: surface.error,
        text: content.error,
      },
      neutral: {
        background: surface.tertiary,
        text: content.secondary,
      },
    },
    navigation: {
      background: surface.secondary,
      border: border.primary,
      active: content.brand1,
      inactive: content.tertiary,
      label: content.primary,
    },
    modal: {
      backdrop: "rgba(0, 0, 0, 0.55)",
      sheet: surface.primary,
      title: content.primary,
      body: content.secondary,
      close: content.tertiary,
      border: border.primary,
    },
  } as const;
}

export const COMPONENT_LIGHT = buildComponentTokens(SEMANTIC_LIGHT);
export const COMPONENT_DARK = buildComponentTokens(SEMANTIC_DARK);

export type ComponentColors = typeof COMPONENT_LIGHT;

export const getComponentColors = (
  mode: "light" | "dark"
): ComponentColors =>
  mode === "dark" ? COMPONENT_DARK : COMPONENT_LIGHT;
