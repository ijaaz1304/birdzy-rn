/**
 * Request to show location permission popup on home (session-based, after subscription flow).
 * RootNavigator subscribes and shows popup when requestShow becomes true.
 */

import { create } from "zustand";

interface LocationPopupState {
  requestShow: boolean;
  setRequestShow: (show: boolean) => void;
}

export const useLocationPopupStore = create<LocationPopupState>()((set) => ({
  requestShow: false,
  setRequestShow: (show: boolean) => set({ requestShow: show }),
}));
