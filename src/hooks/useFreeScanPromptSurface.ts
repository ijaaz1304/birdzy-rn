import { useEffect, useLayoutEffect, useState } from "react";
import { AppState } from "react-native";
import { activateFreeScanPromptSurface } from "../services/freeScanLimitPrompt";

/** Keep the shared modal scoped to a visible identification input screen. */
export function useFreeScanPromptSurface(active: boolean): void {
  const [foreground, setForeground] = useState(
    AppState.currentState === "active"
  );
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      setForeground(state === "active");
    });
    return () => subscription.remove();
  }, []);
  useLayoutEffect(() => {
    if (active && foreground) return activateFreeScanPromptSurface();
    return undefined;
  }, [active, foreground]);
}
