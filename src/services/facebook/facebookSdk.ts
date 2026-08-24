import { Settings } from "react-native-fbsdk-next";
import {
  FACEBOOK_APP_ID,
  FACEBOOK_CLIENT_TOKEN,
} from "../../constants/env";

export function isFacebookSdkConfigured(): boolean {
  return (
    !!FACEBOOK_APP_ID?.trim() && !!FACEBOOK_CLIENT_TOKEN?.trim()
  );
}

/** No-op when Meta app credentials are missing (prevents native FB SDK crash on launch). */
export function initializeFacebookSdkIfConfigured(): void {
  if (!isFacebookSdkConfigured()) {
    if (__DEV__) {
      console.log(
        "[Facebook] SDK skipped — set FACEBOOK_APP_ID and FACEBOOK_CLIENT_TOKEN in .env"
      );
    }
    return;
  }

  try {
    Settings.setAppID(FACEBOOK_APP_ID);
    Settings.setClientToken(FACEBOOK_CLIENT_TOKEN);
    Settings.initializeSDK();
  } catch (error) {
    if (__DEV__) {
      console.warn("[Facebook] SDK initialization failed:", error);
    }
  }
}
