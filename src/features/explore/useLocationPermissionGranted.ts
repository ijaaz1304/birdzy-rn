import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { checkLocationPermission } from "../../services/permissions/permission.service";

/**
 * Whether the app is allowed to use the device location: true or false once
 * checked, null until the first check finishes. It is read again whenever the
 * screen comes into view and whenever the app returns to the foreground, since
 * the permission can be changed in the phone's settings or in a popup.
 */
export function useLocationPermissionGranted(): boolean | null {
  const [granted, setGranted] = useState<boolean | null>(null);
  const focused = useIsFocused();
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const refresh = useCallback(async () => {
    try {
      const permission = await checkLocationPermission();
      if (mounted.current) setGranted(permission.granted);
    } catch {
      // Keep the last known answer; the next check will correct it.
    }
  }, []);
  useEffect(() => {
    if (focused) void refresh();
  }, [focused, refresh]);
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void refresh();
    });
    return () => subscription.remove();
  }, [refresh]);
  return granted;
}
