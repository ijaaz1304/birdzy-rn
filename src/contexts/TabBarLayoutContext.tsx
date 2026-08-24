/**
 * Live horizontal centers of bottom tab items (window coordinates), from measureInWindow.
 * Used to align overlays (e.g. onboarding tooltip) with asymmetric / FAB tab bars.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

export type MeasurableTabName =
  | "Home"
  | "Catalogue"
  | "Camera"
  | "Collection"
  | "Feed";

export type TabCentersX = Partial<Record<MeasurableTabName, number>>;

export type TabBarLayoutContextValue = {
  /** Center X of each tab in window coordinates */
  tabCentersX: TabCentersX;
  reportTabCenter: (name: MeasurableTabName, centerX: number) => void;
};

const TabBarLayoutContext = createContext<TabBarLayoutContextValue | null>(
  null
);

const CENTER_EPSILON = 0.75;

export const TabBarLayoutProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [tabCentersX, setTabCentersX] = useState<TabCentersX>({});

  const reportTabCenter = useCallback(
    (name: MeasurableTabName, centerX: number) => {
      setTabCentersX((prev) => {
        const prevVal = prev[name];
        if (
          prevVal !== undefined &&
          Math.abs(prevVal - centerX) < CENTER_EPSILON
        ) {
          return prev;
        }
        return { ...prev, [name]: centerX };
      });
    },
    []
  );

  const value = useMemo(
    () => ({ tabCentersX, reportTabCenter }),
    [tabCentersX, reportTabCenter]
  );

  return (
    <TabBarLayoutContext.Provider value={value}>
      {children}
    </TabBarLayoutContext.Provider>
  );
};

/** For consumers that must run inside MainTabs (e.g. measured tab button). */
export function useTabBarLayout(): TabBarLayoutContextValue {
  const ctx = useContext(TabBarLayoutContext);
  if (!ctx) {
    throw new Error("useTabBarLayout must be used within TabBarLayoutProvider");
  }
  return ctx;
}

/** For optional consumers (e.g. tooltip) — use geometric fallback when null. */
export function useTabBarLayoutOptional(): TabBarLayoutContextValue | null {
  return useContext(TabBarLayoutContext);
}
