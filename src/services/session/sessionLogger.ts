/**
 * Session and popup decision logging (dev-only).
 * Use for debugging session-based modals and remote config usage.
 */

const PREFIX = "[Session]";

export const sessionLogger = {
  sessionIncremented: (count: number) => {
    if (__DEV__) {
      console.log(`${PREFIX} Session count incremented: ${count}`);
    }
  },

  modalDecision: (
    modal:
      | "subscription"
      | "notification"
      | "rate_us"
      | "bird_of_day"
      | "mushroom_of_day"
      | "version_update",
    decision: "shown" | "not_shown" | "dismissed",
    context?: Record<string, unknown>
  ) => {
    if (__DEV__) {
      const ctx = context ? ` ${JSON.stringify(context)}` : "";
      console.log(`${PREFIX} ${modal} ${decision}${ctx}`);
    }
  },

  limitCheck: (
    type: "identification",
    allowed: boolean,
    context?: Record<string, unknown>
  ) => {
    if (__DEV__) {
      const ctx = context ? ` ${JSON.stringify(context)}` : "";
      console.log(`${PREFIX} limit_check ${type} allowed=${allowed}${ctx}`);
    }
  },
};
