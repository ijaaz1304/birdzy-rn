/**
 * Shared root navigation target shape for push notifications and deep links.
 */

import type { RootStackParamList } from "../../navigation/types";

export type ResolvedRootNavigation = {
  [K in keyof RootStackParamList]: {
    screen: K;
    params: RootStackParamList[K];
  };
}[keyof RootStackParamList];

export type RootNavigateFn = (screen: string, params?: object) => void;
