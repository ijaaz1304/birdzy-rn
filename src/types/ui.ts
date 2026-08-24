/**
 * UI Component Types
 */

export interface IconBadgeProps {
  icon: React.ReactNode;
  size?: "small" | "medium" | "large";
  variant?: "default" | "primary" | "success" | "error";
}

export interface InfoRowProps {
  label: string;
  value: string | number | React.ReactNode;
  icon?: React.ReactNode;
  onPress?: () => void;
  variant?: "default" | "primary" | "secondary";
  /** Override label color (e.g. AI Details spec #5D5D5D / #D1D1D1) */
  labelColor?: string;
  /** Override value color (e.g. AI Details spec #111111 / #FFFFFF) */
  valueColor?: string;
  /** Divider below row (e.g. #E7E7E7 light) */
  rowDividerColor?: string;
  /** Vertical padding for row (e.g. 12) */
  rowPaddingVertical?: number;
  /** Optional style for label text (e.g. fontSize 16, fontWeight 600) */
  labelStyle?: Record<string, unknown>;
  /** Optional style for value text (e.g. fontSize 16, fontWeight 400) */
  valueStyle?: Record<string, unknown>;
}

export interface InfoTextProps {
  text: string;
  linkText?: string;
  onLinkPress?: () => void;
  variant?: "default" | "primary" | "secondary" | "error" | "success";
  size?: "small" | "medium" | "large";
  weight?: "regular" | "medium" | "semibold" | "bold";
}

export interface ExpandableListProps {
  title?: string;
  items: string[];
}

/** Props for MapPreview: static map with optional user location marker. */
export interface MapPreviewProps {
  latitude: number;
  longitude: number;
  hasLocationPermission?: boolean;
  isUserPlant?: boolean;
  onRequestLocationPermission?: () => void;
  /** Explicit zoom (e.g. 3–5 for country). When set, no user-location marker; single marker only. */
  zoom?: number;
  /** When true, show only the given lat/lng marker (no user location). Use for country-level maps. */
  singleMarkerOnly?: boolean;
}

export interface PrimaryActionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  buttonLabel: string;
  onPress: () => void;
}

export interface SectionCardProps {
  icon?: React.ReactNode;
  title?: string;
  children: React.ReactNode;
  onPress?: () => void;
  showArrow?: boolean;
  backgroundColor?: string;
  _borderRadius?: number;
  padding?: number;
  containerStyle?: Record<string, unknown>;
}

export interface ColorScaleProps {
  min: number;
  max: number;
  valueRange: [number, number];
  _value?: number;
  unit?: string;
  colors?: string[];
}

export interface RangeBarProps {
  min: number;
  max: number;
  value?: number;
  idealRange?: [number, number];
  unit?: string;
  colors?: string[];
}

export interface ExpandableSectionProps {
  header: React.ReactNode;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

export interface VerticalMeterProps {
  minLabel: string;
  maxLabel: string;
  value: number;
  idealRange?: [number, number];
}
