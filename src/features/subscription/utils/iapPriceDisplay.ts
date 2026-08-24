import { NativeModules, Platform } from "react-native";
import { hasRealStorePrice } from "./storePlanPricing";

type ProductLike = Record<string, unknown>;

type PricingPhaseLike = {
  formattedPrice?: string;
  priceAmountMicros?: string | number;
  recurrenceMode?: number;
  priceCurrencyCode?: string;
};

type PricingPhasesContainer = {
  pricingPhaseList?: PricingPhaseLike[];
};

/** Google Play Billing: infinite recurring base plan phase. */
const ANDROID_RECURRENCE_INFINITE = 2;

const COUNTRY_TO_CURRENCY: Record<string, string> = {
  IN: "INR",
  US: "USD",
  GB: "GBP",
  AU: "AUD",
  CA: "CAD",
  AE: "AED",
  SG: "SGD",
  DE: "EUR",
  FR: "EUR",
  IT: "EUR",
  ES: "EUR",
  NL: "EUR",
  JP: "JPY",
  NZ: "NZD",
  CH: "CHF",
  SE: "SEK",
  NO: "NOK",
  DK: "DKK",
  BR: "BRL",
  MX: "MXN",
  ZA: "ZAR",
  KR: "KRW",
  PH: "PHP",
  MY: "MYR",
  TH: "THB",
  ID: "IDR",
  VN: "VND",
  PK: "PKR",
  BD: "BDT",
  LK: "LKR",
  NP: "NPR",
  SA: "SAR",
  QA: "QAR",
  KW: "KWD",
  BH: "BHD",
  OM: "OMR",
  EG: "EGP",
  NG: "NGN",
  KE: "KES",
  TR: "TRY",
  RU: "RUB",
  UA: "UAH",
  PL: "PLN",
  CZ: "CZK",
  HU: "HUF",
  RO: "RON",
  IL: "ILS",
  HK: "HKD",
  TW: "TWD",
  CN: "CNY",
};

const TIMEZONE_TO_COUNTRY: Record<string, string> = {
  "Asia/Kolkata": "IN",
  "Asia/Calcutta": "IN",
  "Asia/Dubai": "AE",
  "Asia/Singapore": "SG",
  "Asia/Tokyo": "JP",
  "Asia/Shanghai": "CN",
  "Asia/Hong_Kong": "HK",
  "Europe/London": "GB",
  "America/New_York": "US",
  "America/Los_Angeles": "US",
  "America/Chicago": "US",
  "America/Toronto": "CA",
  "Australia/Sydney": "AU",
};

function regionFromLocaleTag(tag: string | null | undefined): string | null {
  if (!tag || typeof tag !== "string") return null;
  const normalized = tag.trim().replace(/_/g, "-");
  if (!normalized) return null;
  const parts = normalized.split("-").filter(Boolean);
  for (let i = parts.length - 1; i >= 0; i--) {
    const part = parts[i].toUpperCase();
    if (part.length === 2 && COUNTRY_TO_CURRENCY[part]) return part;
  }
  return null;
}

/**
 * Device region for IAP currency.
 * `DeviceInfo.getDeviceCountry()` was removed in react-native-device-info v15 —
 * use OS region settings / timezone / locale instead.
 *
 * When OS language locale (e.g. en-US) conflicts with timezone (e.g. Asia/Kolkata),
 * prefer timezone — language often tracks UI language, not billing location.
 */
export function getDeviceRegionCode(): string | null {
  let fromOs: string | null = null;
  let fromTimezone: string | null = null;
  let fromIntl: string | null = null;

  try {
    if (Platform.OS === "ios") {
      const settings = NativeModules.SettingsManager?.settings as
        | { AppleLocale?: string; AppleLanguages?: string[] }
        | undefined;
      const appleLocale =
        settings?.AppleLocale ?? settings?.AppleLanguages?.[0];
      fromOs = regionFromLocaleTag(appleLocale);
    } else {
      const localeId = NativeModules.I18nManager?.localeIdentifier as
        | string
        | undefined;
      fromOs = regionFromLocaleTag(localeId);
    }
  } catch {
    // ignore
  }

  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && TIMEZONE_TO_COUNTRY[tz]) {
      fromTimezone = TIMEZONE_TO_COUNTRY[tz];
    }
  } catch {
    // ignore
  }

  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale;
    fromIntl = regionFromLocaleTag(locale);
  } catch {
    // ignore
  }

  if (fromOs && fromTimezone && fromOs !== fromTimezone) {
    return fromTimezone;
  }

  for (const code of [fromOs, fromTimezone, fromIntl]) {
    if (code && COUNTRY_TO_CURRENCY[code]) return code;
  }
  return null;
}

function getDeviceCountryCurrency(): string | null {
  const region = getDeviceRegionCode();
  return region ? COUNTRY_TO_CURRENCY[region] ?? null : null;
}

function pickFormattedPrice(
  expectedCurrency: string,
  ...candidates: unknown[]
): string | null {
  for (const candidate of candidates) {
    if (typeof candidate !== "string") continue;
    const trimmed = candidate.trim();
    if (!hasRealStorePrice(trimmed)) continue;
    if (formattedPriceMatchesExpectedCurrency(trimmed, expectedCurrency)) {
      return trimmed;
    }
  }
  return null;
}

function pickAnyRealFormattedPrice(...candidates: unknown[]): string | null {
  for (const candidate of candidates) {
    if (typeof candidate !== "string") continue;
    const trimmed = candidate.trim();
    if (hasRealStorePrice(trimmed)) return trimmed;
  }
  return null;
}

function readPricingPhaseList(source: unknown): PricingPhaseLike[] {
  if (!source || typeof source !== "object") return [];
  const container = source as PricingPhasesContainer;
  return Array.isArray(container.pricingPhaseList)
    ? container.pricingPhaseList
    : [];
}

/** Pick recurring/paid phase price — skips free-trial phases (Play often sets top-level price to Free). */
function pickBestPaidPhaseFormattedPrice(
  phases: PricingPhaseLike[]
): string | null {
  if (!phases.length) return null;

  const recurring = phases.find(
    (phase) =>
      phase.recurrenceMode === ANDROID_RECURRENCE_INFINITE &&
      Number(phase.priceAmountMicros ?? 0) > 0
  );
  if (
    recurring?.formattedPrice &&
    hasRealStorePrice(recurring.formattedPrice.trim())
  ) {
    return recurring.formattedPrice.trim();
  }

  for (let i = phases.length - 1; i >= 0; i--) {
    const phase = phases[i];
    const micros = Number(phase?.priceAmountMicros ?? 0);
    const formatted = phase?.formattedPrice?.trim();
    if (formatted && micros > 0 && hasRealStorePrice(formatted)) {
      return formatted;
    }
  }

  for (let i = phases.length - 1; i >= 0; i--) {
    const formatted = phases[i]?.formattedPrice?.trim();
    if (formatted && hasRealStorePrice(formatted)) return formatted;
  }

  return null;
}

function collectAndroidSubscriptionPhaseLists(
  product: ProductLike
): PricingPhaseLike[][] {
  const lists: PricingPhaseLike[][] = [];

  const standardized = product.subscriptionOffers as
    | Array<{ pricingPhasesAndroid?: unknown }>
    | undefined;
  for (const offer of standardized ?? []) {
    const phases = readPricingPhaseList(offer.pricingPhasesAndroid);
    if (phases.length) lists.push(phases);
  }

  for (const key of [
    "subscriptionOfferDetailsAndroid",
    "subscriptionOfferDetails",
  ] as const) {
    const offers = product[key] as Array<{ pricingPhases?: unknown }> | undefined;
    for (const offer of offers ?? []) {
      const phases = readPricingPhaseList(offer.pricingPhases);
      if (phases.length) lists.push(phases);
    }
  }

  return lists;
}

/**
 * Android subscription recurring price from pricing phases (react-native-iap v14+).
 * Top-level displayPrice is often "Free" when a trial offer applies.
 */
export function getAndroidSubscriptionFormattedPrice(
  product: ProductLike
): string | null {
  for (const phases of collectAndroidSubscriptionPhaseLists(product)) {
    const price = pickBestPaidPhaseFormattedPrice(phases);
    if (price) return price;
  }
  return null;
}

/** Android one-time (lifetime) formatted price from Play offer details. */
export function getAndroidOneTimeFormattedPrice(
  product: ProductLike
): string | null {
  const androidOffers = product.oneTimePurchaseOfferDetailsAndroid as
    | Array<{ formattedPrice?: string; priceAmountMicros?: string }>
    | undefined;
  for (const offer of androidOffers ?? []) {
    const formatted = offer.formattedPrice?.trim();
    if (formatted && hasRealStorePrice(formatted)) return formatted;
  }

  const legacyOffer = product.oneTimePurchaseOfferDetails as
    | { formattedPrice?: string }
    | undefined;
  if (
    legacyOffer?.formattedPrice &&
    hasRealStorePrice(legacyOffer.formattedPrice.trim())
  ) {
    return legacyOffer.formattedPrice.trim();
  }

  const discountOffers = product.discountOffers as
    | Array<{ displayPrice?: string }>
    | undefined;
  for (const offer of discountOffers ?? []) {
    const display = offer.displayPrice?.trim();
    if (display && hasRealStorePrice(display)) return display;
  }

  return null;
}

/** Offer token for Android subscription purchase (v14 subscriptionOffers or legacy details). */
export function getAndroidSubscriptionOfferToken(
  product: ProductLike
): string | null {
  const productId = (product.id as string | undefined) ?? "unknown";
  const standardized = product.subscriptionOffers as
    | Array<{ offerTokenAndroid?: string | null }>
    | undefined;
  console.log("[IAP-DEBUG] getAndroidSubscriptionOfferToken", {
    productId,
    subscriptionOffersCount: standardized?.length ?? 0,
    offerTokenAndroidValues: (standardized ?? []).map(
      (o) => o.offerTokenAndroid?.slice(0, 12) ?? null
    ),
  });
  for (const offer of standardized ?? []) {
    const token = offer.offerTokenAndroid?.trim();
    if (token) {
      console.log("[IAP-DEBUG] offer token from subscriptionOffers", {
        productId,
        source: "subscriptionOffers.offerTokenAndroid",
      });
      return token;
    }
  }

  for (const key of [
    "subscriptionOfferDetailsAndroid",
    "subscriptionOfferDetails",
  ] as const) {
    const offers = product[key] as Array<{ offerToken?: string }> | undefined;
    console.log("[IAP-DEBUG] checking legacy offer key", {
      productId,
      key,
      count: offers?.length ?? 0,
      offerTokens: (offers ?? []).map((o) => o.offerToken?.slice(0, 12) ?? null),
    });
    for (const offer of offers ?? []) {
      const token = offer.offerToken?.trim();
      if (token) {
        console.log("[IAP-DEBUG] offer token from legacy key", {
          productId,
          source: `${key}.offerToken`,
        });
        return token;
      }
    }
  }

  console.warn("[IAP-DEBUG] no Android subscription offer token found", {
    productId,
    keys: Object.keys(product),
  });
  return null;
}

function readOfferPrices(product: ProductLike): string[] {
  const offers = product.subscriptionOffers as
    | Array<{
        displayPrice?: string | null;
        localizedPriceIOS?: string | null;
        formattedPrice?: string | null;
        pricingPhasesAndroid?: unknown;
      }>
    | undefined;
  if (!offers?.length) return [];

  const prices: string[] = [];
  for (const offer of offers) {
    const phasePrice = pickBestPaidPhaseFormattedPrice(
      readPricingPhaseList(offer.pricingPhasesAndroid)
    );
    if (phasePrice) prices.push(phasePrice);
    if (offer.displayPrice) prices.push(offer.displayPrice);
    if (offer.localizedPriceIOS) prices.push(offer.localizedPriceIOS);
    if (offer.formattedPrice) prices.push(offer.formattedPrice);
  }
  return prices;
}

function collectProductFormattedPriceCandidates(
  product: ProductLike
): unknown[] {
  const isSubscription =
    product.type === "subs" ||
    Array.isArray(product.subscriptionOffers) ||
    Array.isArray(product.subscriptionOfferDetailsAndroid);

  const androidPrice = isSubscription
    ? getAndroidSubscriptionFormattedPrice(product)
    : getAndroidOneTimeFormattedPrice(product);

  const oneTime = product.oneTimePurchaseOfferDetails as
    | { formattedPrice?: string }
    | undefined;

  const androidOneTimePrices =
    (
      product.oneTimePurchaseOfferDetailsAndroid as
        | Array<{ formattedPrice?: string }>
        | undefined
    )?.map((o) => o.formattedPrice) ?? [];

  return [
    androidPrice,
    product.displayPrice,
    product.localizedPrice,
    product.localizedPriceIOS,
    ...readOfferPrices(product),
    oneTime?.formattedPrice,
    ...androidOneTimePrices,
  ];
}

/** Infer ISO currency from a store-formatted price string (when explicit currency is missing). */
export function inferCurrencyFromFormattedPrice(
  formatted: string
): string | null {
  const trimmed = formatted.trim();
  if (!trimmed) return null;
  if (trimmed.includes("₹")) return "INR";
  if (/^Rs\.?\s?/i.test(trimmed) || /\bINR\b/i.test(trimmed)) return "INR";
  if (/\bUS\$|\bUSD\b/i.test(trimmed) || /\$/.test(trimmed)) return "USD";
  if (trimmed.includes("£") || /\bGBP\b/i.test(trimmed)) return "GBP";
  if (trimmed.includes("€") || /\bEUR\b/i.test(trimmed)) return "EUR";
  if (/\bAUD\b/i.test(trimmed)) return "AUD";
  if (/\bCAD\b/i.test(trimmed)) return "CAD";
  if (/\bAED\b/i.test(trimmed)) return "AED";
  if (/\bSGD\b/i.test(trimmed)) return "SGD";
  if (/\bJPY\b/i.test(trimmed) || trimmed.includes("¥")) return "JPY";
  return null;
}

function readAndroidPaidPriceAmount(product: ProductLike): number | null {
  for (const phases of collectAndroidSubscriptionPhaseLists(product)) {
    for (let i = phases.length - 1; i >= 0; i--) {
      const micros = Number(phases[i]?.priceAmountMicros ?? 0);
      if (micros > 0) return micros / 1_000_000;
    }
  }

  const oneTimeOffers = product.oneTimePurchaseOfferDetailsAndroid as
    | Array<{ priceAmountMicros?: string | number }>
    | undefined;
  for (const offer of oneTimeOffers ?? []) {
    const micros = Number(offer.priceAmountMicros ?? 0);
    if (micros > 0) return micros / 1_000_000;
  }

  const legacyOneTime = product.oneTimePurchaseOfferDetails as
    | { priceAmountMicros?: string | number }
    | undefined;
  const legacyMicros = Number(legacyOneTime?.priceAmountMicros ?? 0);
  if (legacyMicros > 0) return legacyMicros / 1_000_000;

  return null;
}

function readStoreCurrencyFromProduct(product: ProductLike): string | null {
  const direct =
    typeof product.currency === "string" ? product.currency.trim() : "";
  if (direct.length >= 3) return direct.slice(0, 3).toUpperCase();

  for (const offer of (product.subscriptionOffers as Array<{ currency?: string }>) ??
    []) {
    const offerCurrency = offer?.currency?.trim();
    if (offerCurrency && offerCurrency.length >= 3) {
      return offerCurrency.slice(0, 3).toUpperCase();
    }
  }

  for (const phases of collectAndroidSubscriptionPhaseLists(product)) {
    for (const phase of phases) {
      const code = phase.priceCurrencyCode?.trim();
      if (code && code.length >= 3) return code.slice(0, 3).toUpperCase();
    }
  }

  const oneTime = product.oneTimePurchaseOfferDetails as
    | { priceCurrencyCode?: string }
    | undefined;
  if (oneTime?.priceCurrencyCode?.trim()) {
    return oneTime.priceCurrencyCode.trim().slice(0, 3).toUpperCase();
  }

  const androidOneTime = product.oneTimePurchaseOfferDetailsAndroid as
    | Array<{ priceCurrencyCode?: string }>
    | undefined;
  for (const offer of androidOneTime ?? []) {
    const code = offer.priceCurrencyCode?.trim();
    if (code && code.length >= 3) return code.slice(0, 3).toUpperCase();
  }

  return null;
}

function inferCurrencyFromProductPrices(product: ProductLike): string | null {
  for (const candidate of collectProductFormattedPriceCandidates(product)) {
    if (typeof candidate !== "string") continue;
    const inferred = inferCurrencyFromFormattedPrice(candidate);
    if (inferred) return inferred;
  }
  return null;
}

export function getDeviceCurrency(): string {
  return getDeviceCountryCurrency() ?? "USD";
}

export function formattedPriceMatchesExpectedCurrency(
  formatted: string,
  expectedCurrency: string
): boolean {
  const inferred = inferCurrencyFromFormattedPrice(formatted);
  if (!inferred) return true;
  return inferred === expectedCurrency.toUpperCase();
}

/** Best localized price for UI — prefers store strings matching device/product currency. */
export function resolveProductDisplayPrice(product: ProductLike): string {
  const formatted = pickProductFormattedPrice(product);
  if (formatted) return formatted;

  const numeric = formatNumericProductPrice(product);
  return numeric ?? "";
}

/**
 * Resolve ISO 4217 currency for numeric price formatting.
 * Prefer device/storefront region, then price-string inference, then store metadata.
 */
export function resolveProductCurrency(product: ProductLike): string {
  const deviceCurrency = getDeviceCountryCurrency();
  if (deviceCurrency) return deviceCurrency;

  const inferredFromPrice = inferCurrencyFromProductPrices(product);
  if (inferredFromPrice) return inferredFromPrice;

  const storeCurrency = readStoreCurrencyFromProduct(product);
  if (storeCurrency) return storeCurrency;

  return "USD";
}

function localeForCurrency(currency: string): string | undefined {
  switch (currency) {
    case "INR":
      return "en-IN";
    case "USD":
      return "en-US";
    case "GBP":
      return "en-GB";
    case "EUR":
      return "en-IE";
    case "AUD":
      return "en-AU";
    case "CAD":
      return "en-CA";
    case "AED":
      return "en-AE";
    case "SGD":
      return "en-SG";
    case "JPY":
      return "ja-JP";
    default:
      return undefined;
  }
}

export function formatNumericProductPrice(product: ProductLike): string | null {
  const currency = resolveProductCurrency(product);
  let amount: number | null = null;

  if (typeof product.price === "number" && product.price > 0) {
    amount = product.price;
  } else if (typeof product.price === "string") {
    const parsed = parseFloat(product.price.replace(/[^0-9.]/g, ""));
    if (parsed > 0) amount = parsed;
  }

  if (amount == null) {
    amount = readAndroidPaidPriceAmount(product);
  }

  if (amount == null) return null;

  try {
    return new Intl.NumberFormat(localeForCurrency(currency), {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

/** Best localized price string from a react-native-iap product (v14 / StoreKit 2). */
export function pickProductFormattedPrice(product: ProductLike): string | null {
  const expectedCurrency = resolveProductCurrency(product);
  const candidates = collectProductFormattedPriceCandidates(product);

  const matched = pickFormattedPrice(expectedCurrency, ...candidates);
  if (matched) return matched;

  // Only keep a mismatched store string when device region is unknown.
  if (!getDeviceCountryCurrency()) {
    return pickAnyRealFormattedPrice(...candidates);
  }
  return null;
}

/**
 * Ensure a price string matches the device/storefront currency when possible.
 * Never re-labels mismatched digits (e.g. $4.99 → ₹4.99).
 */
export function localizePriceDisplayForDevice(priceDisplay: string): string {
  const trimmed = priceDisplay.trim();
  if (!hasRealStorePrice(trimmed)) return trimmed;

  const deviceCurrency = getDeviceCurrency();
  if (formattedPriceMatchesExpectedCurrency(trimmed, deviceCurrency)) {
    return trimmed;
  }

  // Keep store string when symbols conflict — amount units differ by currency.
  return trimmed;
}
