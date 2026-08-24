/** Keep currency formatting; pad fractional part to 2 digits when present. */
import { Platform } from "react-native";
import { hasRealStorePrice } from "../../subscription/utils/storePlanPricing";
import { localizePriceDisplayForDevice } from "../../subscription/utils/iapPriceDisplay";

export type SubscriptionDisclosurePlan = {
  duration?: string;
  priceDisplay?: string;
  trialDays?: number;
};

function getBillingPeriodLabel(duration: string): string {
  switch (duration.toLowerCase()) {
    case "week":
      return "week";
    case "month":
      return "month";
    case "year":
      return "year";
    default:
      return "billing period";
  }
}

function formatTrialPeriodLabel(trialDays: number): string {
  if (trialDays === 7) return "1 week";
  if (trialDays === 1) return "1 day";
  return `${trialDays} days`;
}

function getRenewalPriceDisplay(
  duration: string,
  priceDisplay?: string
): string | null {
  const trimmed = priceDisplay?.trim();
  if (!trimmed || !hasRealStorePrice(trimmed)) return null;
  const parsed = parsePriceDisplay(trimmed);
  return formatPlanCardPrimaryPrice(parsed.amount, parsed.suffix, duration);
}

/** Trial length for CTA-adjacent Apple disclosure (cards use getPlanCardTrialDays). */
function getDisclosureTrialDays(duration: string, trialDays?: number): number {
  const normalized = duration.toLowerCase();
  if (normalized === "lifetime") return 0;
  if (trialDays != null && trialDays > 0) return trialDays;
  if (normalized === "week" || normalized === "month") return 3;
  if (normalized === "year") return 7;
  return 0;
}

function getDisclosureRenewalPrice(
  duration: string,
  priceDisplay?: string
): string | null {
  const trimmed = priceDisplay?.trim();
  if (!trimmed || !hasRealStorePrice(trimmed)) return null;
  const parsed = parsePriceDisplay(trimmed);

  if (duration === "week") {
    return `${compactPriceDecimals(parsed.amount)}/month`;
  }

  return formatPlanCardPrimaryPrice(parsed.amount, parsed.suffix, duration);
}

/** Apple-required subscription disclosure shown as subtle text above the purchase CTA. */
export function getSubscriptionTrialDisclosureText(options: {
  duration?: string;
  priceDisplay?: string;
  trialDays?: number;
  platform?: typeof Platform.OS;
}): string {
  const duration = (options.duration ?? "year").toLowerCase();
  const trialDays = getDisclosureTrialDays(duration, options.trialDays);
  const renewalPrice = getDisclosureRenewalPrice(duration, options.priceDisplay);
  const periodLabel = getBillingPeriodLabel(duration);

  if (duration === "lifetime") {
    return renewalPrice ? `One-time purchase of ${renewalPrice}` : "";
  }

  if (trialDays > 0) {
    const trialLabel = formatTrialPeriodLabel(trialDays);
    if (renewalPrice) {
      return `${trialLabel} free, then ${renewalPrice}`;
    }
    const billingCadence =
      periodLabel === "year"
        ? "yearly"
        : periodLabel === "month"
          ? "monthly"
          : "weekly";
    return `${trialLabel} free, then billed ${billingCadence}`;
  }

  return renewalPrice ? `${renewalPrice}, auto-renewing unless cancelled` : "";
}

export function compactPriceDecimals(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  return trimmed
    .replace(/(\d)\.00(?=\D|$)/g, "$1")
    .replace(/(\d)\.0(?=\D|$)/g, "$1");
}

/** Localize a compare-at / strikethrough store price for the current device region. */
export function localizeCompareAtPriceDisplay(
  priceDisplay: string | null | undefined
): string | null {
  if (!priceDisplay || !hasRealStorePrice(priceDisplay)) return null;
  return localizePriceDisplayForDevice(priceDisplay.trim());
}

export function normalizePriceAmount(amount: string): string {
  const trimmed = amount.trim();
  if (
    !trimmed ||
    trimmed === "—" ||
    trimmed === "--" ||
    trimmed === "Loading…"
  ) {
    return trimmed === "--" ? "—" : trimmed;
  }

  const match = trimmed.match(/^([^\d]*)([\d,]+)(?:\.(\d*))?([^\d]*)$/);
  if (!match) return compactPriceDecimals(trimmed);

  const [, prefix, intPart, decPart] = match;
  if (!trimmed.includes(".")) {
    return `${prefix}${intPart}`.trim();
  }

  if (!decPart || /^0+$/.test(decPart)) {
    return `${prefix}${intPart}`.trim();
  }

  const normalizedDecimals = decPart.padEnd(2, "0").slice(0, 2);
  return compactPriceDecimals(`${prefix}${intPart}.${normalizedDecimals}`.trim());
}

/** Smaller font for long store prices so the full amount fits in narrow plan cards. */
export function getHorizontalPlanPriceFontSize(
  amount: string,
  baseSize = 16,
  platform: "ios" | "android" | "default" = "default"
): number {
  const iosBase = platform === "ios" ? Math.max(baseSize, 16) : baseSize;
  const len = amount.trim().length;
  if (len <= 7) return iosBase;
  if (len <= 9) return iosBase - 1;
  if (len <= 11) return iosBase - 2;
  if (len <= 14) return iosBase - 3;
  return iosBase - 4;
}

export function parsePriceDisplay(priceDisplay: string): {
  amount: string;
  suffix: string;
} {
  const trimmed = priceDisplay.trim();
  if (!trimmed || trimmed === "Loading…" || trimmed === "--") {
    return { amount: trimmed === "--" ? "—" : trimmed || "—", suffix: "" };
  }
  if (trimmed === "—") {
    return { amount: "—", suffix: "" };
  }

  const match = trimmed.match(/^([^\d]*[\d,.]+)(.*)$/);
  if (!match) {
    return { amount: trimmed, suffix: "" };
  }

  return {
    amount: normalizePriceAmount(match[1].trim()),
    suffix: match[2].trim(),
  };
}

export function getPlanSuffix(duration: string): string {
  switch (duration.toLowerCase()) {
    case "week":
      return "/week";
    case "month":
      return "/month";
    case "year":
      return "/year";
    case "lifetime":
      return "/one-time";
    default:
      return "";
  }
}

export function stripPlanSuffixFromAmount(
  amount: string,
  suffix?: string,
  duration?: string
): string {
  let result = amount.trim();
  const candidates = [
    suffix?.trim(),
    duration ? getPlanSuffix(duration) : "",
    "/year",
    "/week",
    "/month",
    "/one-time",
    "/once",
  ].filter(Boolean) as string[];

  let changed = true;
  while (changed) {
    changed = false;
    for (const candidate of candidates) {
      if (result.endsWith(candidate)) {
        result = result.slice(0, -candidate.length).trim();
        changed = true;
      }
    }
  }

  return result;
}

/** Split price parts for narrow horizontal plan cards. */
export function getPlanCardPriceParts(
  amount: string,
  suffix?: string,
  duration?: string
): { amount: string; suffix: string } {
  const base = compactPriceDecimals(
    stripPlanSuffixFromAmount(
      normalizePriceAmount(amount),
      suffix,
      duration
    )
  );
  const planSuffix = (
    suffix?.trim() || (duration ? getPlanSuffix(duration) : "")
  ).trim();
  return { amount: base, suffix: planSuffix };
}

/** Single primary price label for plan cards, e.g. "₹1,499/year". */
export function formatPlanCardPrimaryPrice(
  amount: string,
  suffix?: string,
  duration?: string
): string {
  const { amount: base, suffix: planSuffix } = getPlanCardPriceParts(
    amount,
    suffix,
    duration
  );
  if (!planSuffix || base.endsWith(planSuffix)) {
    return base;
  }
  return `${base}${planSuffix}`;
}

export function getPlanBillingNote(
  duration: string,
  priceDisplay?: string
): string | undefined {
  switch (duration.toLowerCase()) {
    case "week":
      return "Billed weekly";
    case "month":
      return "Billed monthly";
    case "year": {
      const parsed = priceDisplay ? parsePriceDisplay(priceDisplay) : null;
      const amount = parsed?.amount?.replace(/[^\d.,]/g, "");
      const num = amount ? parseFloat(amount.replace(/,/g, "")) : NaN;
      const prefix = parsed?.amount?.match(/^[^\d]*/)?.[0] ?? "";
      if (!prefix || Number.isNaN(num) || num <= 0) {
        return undefined;
      }
      const monthly = (num / 12).toFixed(2);
      return compactPriceDecimals(`${prefix}${monthly}/month`);
    }
    default:
      return undefined;
  }
}

export function getDefaultTrialDays(
  duration: string,
  trialDays?: number
): number {
  if (trialDays != null && trialDays > 0) return trialDays;
  const normalized = duration.toLowerCase();
  if (normalized === "week" || normalized === "lifetime") return 0;
  return normalized === "month" ? 3 : 7;
}

/** Trial days for horizontal plan cards — lifetime never shows a trial block. */
export function getPlanCardTrialDays(
  duration: string,
  trialDays?: number
): number | undefined {
  if (duration.toLowerCase() === "lifetime") return undefined;
  const days = getDefaultTrialDays(duration, trialDays);
  return days > 0 ? days : undefined;
}

export function getSubscriptionCtaLabel(options: {
  isPurchasing?: boolean;
  selectedPlan?: {
    duration?: string;
    priceDisplay?: string;
    trialDays?: number;
  } | null;
  has50Discount?: boolean;
  isPremium?: boolean;
  disableSubscribe?: boolean;
  /** Post-auth subscription slide — prefer trial CTA over price label. */
  useTrialCta?: boolean;
}): string {
  const {
    isPurchasing,
    selectedPlan,
    has50Discount = false,
    isPremium = false,
    disableSubscribe = false,
    useTrialCta = false,
  } = options;

  if (isPurchasing) return "Processing…";
  if (disableSubscribe) return "You're already subscribed";
  if (isPremium) return "Upgrade";
  if (!selectedPlan) return "Start my free trial";

  const duration = (selectedPlan.duration ?? "").toLowerCase();
  if (duration === "week" || duration === "lifetime") {
    return "Continue";
  }

  const priceDisplay = selectedPlan.priceDisplay?.trim();
  const hasPrice = hasRealStorePrice(priceDisplay);
  const trialDays = getDefaultTrialDays(duration, selectedPlan.trialDays);

  if ((useTrialCta || has50Discount) && trialDays > 0) {
    return `Try free for ${trialDays} days`;
  }
  if (hasPrice && duration === "year") {
    return `Subscribe for ${priceDisplay}/year`;
  }
  if (hasPrice && duration === "month") {
    return `Subscribe for ${priceDisplay}/month`;
  }

  return "Start my free trial";
}

export function getPlanDisplayTitle(
  duration: string,
  fallback: string
): string {
  switch (duration.toLowerCase()) {
    case "week":
      return "Weekly";
    case "month":
      return "Monthly";
    case "year":
      return "Yearly";
    case "lifetime":
      return "Life-time";
    default:
      return fallback;
  }
}

/** Plan card price fields — no suffix/billing note when IAP price is unavailable. */
export function getPlanCardPriceView(
  priceDisplay: string | undefined,
  duration: string
): {
  amount: string;
  suffix: string;
  billingNote?: string;
  hasStorePrice: boolean;
} {
  const trimmed = localizePriceDisplayForDevice(priceDisplay?.trim() ?? "");
  if (trimmed === "Loading…") {
    return { amount: "Loading…", suffix: "", hasStorePrice: false };
  }
  if (!trimmed || trimmed === "—" || trimmed === "--") {
    return { amount: "—", suffix: "", hasStorePrice: false };
  }

  const parsed = parsePriceDisplay(trimmed);
  const numeric = parseFloat(parsed.amount.replace(/[^0-9.]/g, ""));
  if (/^free$/i.test(parsed.amount) || (/\d/.test(parsed.amount) && !(numeric > 0))) {
    return { amount: "—", suffix: "", hasStorePrice: false };
  }

  return {
    amount: stripPlanSuffixFromAmount(
      parsed.amount,
      parsed.suffix || getPlanSuffix(duration),
      duration
    ),
    suffix: parsed.suffix || getPlanSuffix(duration),
    billingNote: getPlanBillingNote(duration, trimmed),
    hasStorePrice: true,
  };
}
