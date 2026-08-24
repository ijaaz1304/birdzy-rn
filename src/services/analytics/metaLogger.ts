import { AppEventsLogger } from "react-native-fbsdk-next";
import { META_EVENT_MAPPING } from "./metaEventMapping";
import { isFacebookSdkConfigured } from "../facebook/facebookSdk";

export const logMetaEvent = (
  eventKey: keyof typeof META_EVENT_MAPPING,
  params: Record<string, any> = {}
) => {
  if (!isFacebookSdkConfigured()) {
    return;
  }

  const metaEvent = META_EVENT_MAPPING[eventKey];

  if (!metaEvent) return;

  if (eventKey === "subscription_purchase") {
    const rawValue = Number(params?.value);
    const value = Number.isFinite(rawValue) ? rawValue : 0;
    const currency = String(params?.currency || "INR")
      .slice(0, 3)
      .toUpperCase();
    const { value: _value, currency: _currency, ...extraParams } = params;
    AppEventsLogger.logPurchase(value, currency, extraParams);
    return;
  }

  AppEventsLogger.logEvent(metaEvent, params);
};
