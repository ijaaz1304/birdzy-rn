/**
 * SVG Atom Component
 * Wrapper for SVG imports to make them easier to use throughout the app
 */

import React from "react";
import { ViewStyle } from "react-native";
import { SvgProps as RNSvgProps } from "react-native-svg";

export interface SvgComponentProps extends RNSvgProps {
  SvgComponent: React.ComponentType<RNSvgProps>;
  width?: number | string;
  height?: number | string;
  style?: ViewStyle;
  color?: string;
  opacity?: number;
}

/**
 * Generic SVG component that wraps imported SVG files
 */
export const Svg: React.FC<SvgComponentProps> = ({
  SvgComponent,
  width = 24,
  height = 24,
  style,
  color,
  opacity = 1,
  ...props
}) => {
  return (
    <SvgComponent
      width={width}
      height={height}
      fill={color}
      opacity={opacity}
      style={style}
      {...props}
    />
  );
};
