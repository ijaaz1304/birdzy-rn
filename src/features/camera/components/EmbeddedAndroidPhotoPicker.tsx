import React from "react";
import { NativeSyntheticEvent, requireNativeComponent, StyleSheet, ViewProps } from "react-native";
type PhotoEvent = NativeSyntheticEvent<{ uri: string }>;
type ErrorEvent = NativeSyntheticEvent<{ message: string }>;

export type EmbeddedAndroidPhotoPickerProps = ViewProps & {
  maxSelectable?: number;
  accentColor?: number;
  onPhotoSelected?: (event: PhotoEvent) => void;
  onPhotoDeselected?: (event: PhotoEvent) => void;
  onSessionError?: (event: ErrorEvent) => void;
};

const NativeEmbeddedPhotoPicker =
  requireNativeComponent<EmbeddedAndroidPhotoPickerProps>(
    "EmbeddedPhotoPickerView"
  );

export const EmbeddedAndroidPhotoPicker: React.FC<
  EmbeddedAndroidPhotoPickerProps
> = (props) => (
  <NativeEmbeddedPhotoPicker
    {...props}
    collapsable={false}
    style={[styles.picker, props.style]}
  />
);

const styles = StyleSheet.create({
  picker: {
    flex: 1,
  },
});
