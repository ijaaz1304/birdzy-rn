/**
 * Bird App — Primitive color tokens
 *
 * Raw palette values. These do NOT change between Light and Dark mode.
 * Do not use primitives directly in UI — consume semantic or component tokens.
 */

export const PRIMITIVES = {
  grey: {
    white: "#FFFFFF",
    50: "#F6F6F6",
    100: "#E7E7E7",
    200: "#D1D1D1",
    300: "#B0B0B0",
    400: "#888888",
    500: "#6D6D6D",
    600: "#5D5D5D",
    700: "#4F4F4F",
    800: "#333333",
    900: "#242424",
    910: "#1C1C1C",
    920: "#171717",
    950: "#111111",
  },
  brand1: {
    primary: "#C7630C",
    light1: "#F7E6CD",
    light2: "#FDBE62",
    dark3: "#1D1B17",
  },
  brand2: {
    primary: "#4D3221",
    light1: "#F6E6D8",
    light2: "#B88A4A",
    dark3: "#3C2B1A",
    dark4: "#3E3127",
  },
  yellow: {
    20: "#FFF9EB",
    50: "#FEFCE8",
    100: "#FEF9C3",
    200: "#FEF08A",
    300: "#FDE047",
    400: "#FACC15",
    500: "#EAB308",
    600: "#CA8A04",
    700: "#A16207",
    800: "#854D0E",
    900: "#713F12",
    950: "#422006",
  },
  green: {
    50: "#EBFFF2",
    100: "#DCFCE7",
    200: "#BBF7D0",
    300: "#86EFAC",
    400: "#4ADE80",
    500: "#22C55E",
    600: "#16A34A",
    700: "#15803D",
    800: "#166534",
    900: "#14532D",
    950: "#122F1E",
  },
  red: {
    50: "#FEF2F2",
    100: "#FEE2E2",
    200: "#FECACA",
    300: "#FCA5A5",
    400: "#F87171",
    500: "#EF4444",
    600: "#DC2626",
    700: "#B91C1C",
    800: "#991B1B",
    900: "#7F1D1D",
    950: "#311010",
  },
  orange: {
    50: "#FFF7ED",
    100: "#FFEDD5",
    200: "#FED7AA",
    300: "#FDBA74",
    400: "#FB923C",
    500: "#F97316",
    600: "#EA580C",
    700: "#C2410C",
    800: "#9A3412",
    900: "#7C2D12",
    950: "#2A1C13",
  },
  blue: {
    primary: "#007AFF",
  },
} as const;

/** Shared alpha border used in both themes */
export const BRAND2_BORDER_ALPHA = "rgba(199, 99, 12, 0.16)" as const;

/** Accent surface used for brand-1 accent fills (both themes) */
export const BRAND1_ACCENT_SURFACE = "#513103" as const;

export type Primitives = typeof PRIMITIVES;
