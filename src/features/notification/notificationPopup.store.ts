/**
 * Request to show notification permission popup (e.g. after returning from subscription).
 * RootNavigator subscribes and shows popup when requestShow becomes true.
 */

import { create } from "zustand";

interface NotificationPopupState {
  requestShow: boolean;
  setRequestShow: (show: boolean) => void;
}

export const useNotificationPopupStore = create<NotificationPopupState>()(
  (set) => ({
    requestShow: false,
    setRequestShow: (show: boolean) => set({ requestShow: show }),
  })
);
