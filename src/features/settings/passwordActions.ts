/** Password updates use the authenticated profile endpoint. */
import { authService } from "../auth/services/auth.service";
import { useAuthStore } from "../auth/auth.store";
import { SETTINGS_STRINGS } from "../../config/strings/settings.strings";
const S = SETTINGS_STRINGS.passwordSheet;

async function setPassword(password: string): Promise<void> {
  try {
    const result = await authService.updateProfile({ password });
    if (result.token) useAuthStore.getState().setToken(result.token);
  } catch {
    throw new Error(S.failed);
  }
}

export async function changePassword(newPassword: string): Promise<void> {
  await setPassword(newPassword);
}

export async function createPassword(newPassword: string): Promise<void> {
  await setPassword(newPassword);
}
