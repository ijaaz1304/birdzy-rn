/**
 * Navigation logger – logs screen navigation for debugging and analytics.
 * Used by RootNavigator onStateChange.
 */

export const NAV_LOG_PREFIX = "[Nav]";

export function logPageNavigation(
  screenName: string,
  params?: Record<string, unknown>
): void {
  if (__DEV__ && screenName) {
    const paramsStr =
      params && Object.keys(params).length > 0
        ? ` ${JSON.stringify(params)}`
        : "";
    console.log(`${NAV_LOG_PREFIX} ${screenName}${paramsStr}`);
  }
}
