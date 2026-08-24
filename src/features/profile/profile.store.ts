/**
 * Profile store using Zustand
 * Fetches and updates profile via auth API; syncs with auth store when updated.
 */

import { create } from "zustand";
import { User } from "../auth/auth.store";
import { authService } from "../auth/services/auth.service";
import { useAuthStore } from "../auth/auth.store";
import type { UpdateProfileRequest } from "../../services/api/features/auth.api.types";
import { storageService } from "../../services/firebase/storage.service";

interface ProfileState {
  profile: User | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchProfile: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  uploadAvatar: (uri: string) => Promise<void>;
  reset: () => void;
}

function userUpdatesToRequest(updates: Partial<User>): UpdateProfileRequest {
  const fullName =
    updates.name ??
    ([updates.firstName, updates.lastName].filter(Boolean).join(" ") ||
      undefined);
  return {
    fullName: fullName?.trim() || undefined,
    phone: updates.phone,
    picture: updates.avatar,
    country: updates.country,
    gender: updates.gender,
    age: updates.age,
  };
}

export const useProfileStore = create<ProfileState>((set) => ({
  profile: null,
  isLoading: false,
  error: null,

  fetchProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await authService.getProfile();
      set({ profile: result.user, isLoading: false });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to fetch profile",
        isLoading: false,
      });
    }
  },

  updateProfile: async (updates: Partial<User>) => {
    set({ isLoading: true, error: null });
    try {
      const request = userUpdatesToRequest(updates);
      const result = await authService.updateProfile(request);
      set((state) => ({
        profile: state.profile
          ? { ...state.profile, ...result.user }
          : result.user,
        isLoading: false,
      }));
      useAuthStore.getState().setUser(result.user);
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to update profile",
        isLoading: false,
      });
      throw error;
    }
  },

  uploadAvatar: async (uri: string) => {
    set({ isLoading: true, error: null });
    try {
      const userId = useAuthStore.getState().user?.id ?? "anonymous";
      const fileName = `avatar-${userId}-${Date.now()}.jpg`;
      const { url } = await storageService.uploadImage({
        path: "avatars",
        fileName,
        uri,
      });
      const result = await authService.updateProfile({ picture: url });
      set((state) => ({
        profile: state.profile
          ? { ...state.profile, avatar: result.user.avatar }
          : result.user,
        isLoading: false,
      }));
      useAuthStore.getState().setUser(result.user);
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to upload avatar",
        isLoading: false,
      });
      throw error;
    }
  },

  reset: () => {
    set({ profile: null, isLoading: false, error: null });
  },
}));
