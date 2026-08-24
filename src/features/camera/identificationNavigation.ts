import type { NavigatorScreenParams } from "@react-navigation/native";
import type { CameraStackParamList } from "../../navigation/types";

export const IDENTIFICATION_LOCATION_GATE_SCREEN =
  "IdentificationLocationGate" as const;

export type IdentificationCameraEntryParams =
  NavigatorScreenParams<CameraStackParamList>;

/** Center tab + deep links open the identify hub first. */
export function getIdentificationCameraEntryParams(): IdentificationCameraEntryParams {
  return { screen: "IdentifyHub" };
}
