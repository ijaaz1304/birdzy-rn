/**
 * Context so screens (e.g. Home) can hide UI (e.g. sticky discount banner) when the app logs tooltip is visible.
 * MainTabs owns the state and provides it via this context.
 * Run-after-tooltip: HomeScreen registers a callback that runs when the tooltip is closed (so session modals run after tooltip).
 */
import { createContext, useContext } from "react";

export type TooltipVisibilityContextValue = {
  tooltipVisible: boolean;
  setTooltipVisible: (visible: boolean) => void;
  /** Register a callback to run when the app logs tooltip is closed. Used to run session modals (subscription, etc.) after tooltip. */
  registerRunAfterTooltipComplete: (fn: () => void | Promise<void>) => void;
  /** Called by MainTabs when tooltip closes; invokes the registered callback. */
  runAfterTooltipComplete: () => void | Promise<void>;
};

export const TooltipVisibilityContext =
  createContext<TooltipVisibilityContextValue | null>(null);

export function useTooltipVisibility(): boolean {
  const ctx = useContext(TooltipVisibilityContext);
  return ctx?.tooltipVisible ?? false;
}

export function useRunAfterTooltipComplete(): TooltipVisibilityContextValue["registerRunAfterTooltipComplete"] {
  const ctx = useContext(TooltipVisibilityContext);
  return ctx?.registerRunAfterTooltipComplete ?? (() => {});
}
