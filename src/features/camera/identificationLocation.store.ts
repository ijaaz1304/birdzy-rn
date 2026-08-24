import { create } from "zustand";

export type IdentificationLocation = {
  latitude: number;
  longitude: number;
  address: string;
};

interface IdentificationLocationState {
  location: IdentificationLocation | null;
  permissionGranted: boolean;
  setPermissionGranted: (granted: boolean) => void;
  setLocation: (location: IdentificationLocation | null) => void;
  reset: () => void;
}

export const useIdentificationLocationStore =
  create<IdentificationLocationState>((set) => ({
    location: null,
    permissionGranted: false,
    setPermissionGranted: (granted) => set({ permissionGranted: granted }),
    setLocation: (location) => set({ location }),
    reset: () => set({ location: null, permissionGranted: false }),
  }));
