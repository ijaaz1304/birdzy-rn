/**
 * App Configuration Context
 * Provides app configuration throughout the app
 */

import React, { createContext, useContext, ReactNode } from "react";
import { AppConfig } from "./types";

interface AppConfigContextValue {
  config: AppConfig;
}

const AppConfigContext = createContext<AppConfigContextValue | undefined>(
  undefined
);

export interface AppConfigProviderProps {
  config: AppConfig;
  children: ReactNode;
}

/**
 * App Configuration Provider
 * Wrap your app with this provider to inject configuration
 */
export const AppConfigProvider: React.FC<AppConfigProviderProps> = ({
  config,
  children,
}) => {
  return (
    <AppConfigContext.Provider value={{ config }}>
      {children}
    </AppConfigContext.Provider>
  );
};

/**
 * Hook to access app configuration
 * @throws Error if used outside AppConfigProvider
 */
export const useAppConfig = (): AppConfig => {
  const context = useContext(AppConfigContext);
  if (!context) {
    throw new Error("useAppConfig must be used within AppConfigProvider");
  }
  return context.config;
};

/**
 * Hook to access specific feature config
 */
export const useFeatureConfig = <T extends keyof AppConfig>(
  feature: T
): AppConfig[T] => {
  const config = useAppConfig();
  return config[feature];
};
