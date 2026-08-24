/**
 * Request to show Rate Us modal when user reaches home screen.
 * RootNavigator subscribes and shows modal when requestShow becomes true.
 */

import { create } from "zustand";

interface RateUsRequestState {
  requestShow: boolean;
  setRequestShow: (show: boolean) => void;
}

export const useRateUsRequestStore = create<RateUsRequestState>()((set) => ({
  requestShow: false,
  setRequestShow: (show: boolean) => set({ requestShow: show }),
}));
