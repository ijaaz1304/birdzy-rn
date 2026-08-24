import { AppLink } from "react-native-fbsdk-next";
import { parseReferrer } from "./referrerParser";
import { isFacebookSdkConfigured } from "../facebook/facebookSdk";

type MetaAttributionPayload = {
  raw: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
};

function getDebugReferrer(): string | null {
  if (!__DEV__) {
    return null;
  }
  const value = (globalThis as { ATTRIBUTION_DEBUG_REFERRER?: string })
    .ATTRIBUTION_DEBUG_REFERRER;
  return typeof value === "string" ? value : null;
}

function buildAttribution(url: string): MetaAttributionPayload {
  const parsed = parseReferrer(url);
  return {
    raw: url,
    utm_source: parsed.source || "facebook",
    utm_medium: parsed.medium || "ads",
    utm_campaign: parsed.campaign || "",
  };
}

export const getMetaAttribution =
  async (): Promise<MetaAttributionPayload | null> => {
    if (!isFacebookSdkConfigured()) {
      return null;
    }

    const debugReferrer = getDebugReferrer();
    if (debugReferrer) {
      return buildAttribution(debugReferrer);
    }

    const available =
      typeof (AppLink as { fetchDeferredAppLink?: unknown })
        .fetchDeferredAppLink === "function";
    let result: unknown;
    try {
      result = await AppLink.fetchDeferredAppLink();
      if (result == null) {
        return null;
      }
      let url = "";
      if (typeof result === "string") {
        url = result.trim();
      } else if (typeof result === "object" && result !== null) {
        const o = result as { target_url?: string; targetURL?: string };
        url = String(o.target_url ?? o.targetURL ?? "").trim();
      }
      if (!url) {
        return null;
      }
      return buildAttribution(url);
    } catch (e) {
      if (__DEV__) {
        console.warn("[Attribution] Meta attribution error", {
          available,
          error: e instanceof Error ? e.message : String(e),
        });
      }
      return null;
    }
  };
