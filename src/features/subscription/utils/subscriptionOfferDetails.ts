type ProductLike = Record<string, unknown>;

type PricingPhaseLike = {
  formattedPrice?: string;
  priceAmountMicros?: string | number;
  billingCycleCount?: number;
  billingPeriod?: string;
  recurrenceMode?: number;
};

type NormalizedAndroidSubscriptionOffer = {
  offerToken: string;
  basePlanId: string | null;
  offerId: string | null;
  phases: PricingPhaseLike[];
  source: string;
};

/** Offer chosen for Android subscription purchase / UI / analytics. */
export type SelectedAndroidSubscriptionOffer = {
  offerToken: string;
  basePlanId: string | null;
  offerId: string | null;
  isTrial: boolean;
  trialDays: number;
};

/**
 * Preferred base plan when Play returns multiple *eligible* offers for the same SKU.
 * Keys must match the runtime store product id (Android SKU or iOS product id).
 */
const PREFERRED_BASE_PLAN_BY_PRODUCT_ID: Record<string, string> = {
  yearly_birdzy_pack_half_price: "yearly-pack-half-price-trial",
  yearly_birdzy_pack: "yearly-pack-trial-full",
  yearly_pack_birdzy: "yearly-pack-trial-full",
  weekly_pack_birdzy: "weekly-pack-trial",
};

export type SelectAndroidSubscriptionOfferOptions = {
  logSelection?: boolean;
  /**
   * When true, skip free-trial offers and select a paid offer.
   * Used when our trusted user history says the trial was already consumed
   * or the user is already subscribed.
   */
  preferPaidOffer?: boolean;
};

function readPricingPhaseList(source: unknown): PricingPhaseLike[] {
  if (!source || typeof source !== "object") return [];
  const container = source as { pricingPhaseList?: PricingPhaseLike[] };
  return Array.isArray(container.pricingPhaseList)
    ? container.pricingPhaseList
    : [];
}

function collectNormalizedAndroidSubscriptionOffers(
  product: ProductLike
): NormalizedAndroidSubscriptionOffer[] {
  const byToken = new Map<string, NormalizedAndroidSubscriptionOffer>();

  const add = (entry: NormalizedAndroidSubscriptionOffer) => {
    const token = entry.offerToken.trim();
    if (!token) return;
    if (!byToken.has(token)) {
      byToken.set(token, entry);
    }
  };

  const standardized = product.subscriptionOffers as
    | Array<{
        offerTokenAndroid?: string | null;
        basePlanIdAndroid?: string | null;
        id?: string | null;
        pricingPhasesAndroid?: unknown;
      }>
    | undefined;

  for (const offer of standardized ?? []) {
    add({
      offerToken: offer.offerTokenAndroid ?? "",
      basePlanId: offer.basePlanIdAndroid?.trim() || null,
      offerId: typeof offer.id === "string" ? offer.id.trim() || null : null,
      phases: readPricingPhaseList(offer.pricingPhasesAndroid),
      source: "subscriptionOffers",
    });
  }

  for (const key of [
    "subscriptionOfferDetailsAndroid",
    "subscriptionOfferDetails",
  ] as const) {
    const offers = product[key] as
      | Array<{
          offerToken?: string;
          basePlanId?: string;
          offerId?: string;
          pricingPhases?: unknown;
        }>
      | undefined;
    for (const offer of offers ?? []) {
      add({
        offerToken: offer.offerToken ?? "",
        basePlanId: offer.basePlanId?.trim() || null,
        offerId: offer.offerId?.trim() || null,
        phases: readPricingPhaseList(offer.pricingPhases),
        source: key,
      });
    }
  }

  return Array.from(byToken.values());
}

function preferredBasePlanIdForProduct(
  productId: string | undefined
): string | null {
  if (!productId) return null;
  return PREFERRED_BASE_PLAN_BY_PRODUCT_ID[productId] ?? null;
}

function pickPreferredOffer(
  candidates: NormalizedAndroidSubscriptionOffer[],
  preferredBasePlanId: string | null
): NormalizedAndroidSubscriptionOffer | null {
  if (!candidates.length) return null;
  if (preferredBasePlanId) {
    const match = candidates.find((o) => o.basePlanId === preferredBasePlanId);
    if (match) return match;
  }
  return candidates[0] ?? null;
}

/** First pricing phase is a free trial (Play Billing parity with iap.service detectAndroidTrial). */
export function isFirstPhaseFreeTrial(phases: PricingPhaseLike[]): boolean {
  const first = phases[0];
  if (!first) return false;
  const micros = Number(first.priceAmountMicros ?? -1);
  const cycleCount = Number(first.billingCycleCount ?? 1);
  return micros === 0 && cycleCount >= 1;
}

/** Trial length from the first pricing phase when it is free. */
export function trialDaysFromOfferFirstPhase(
  phases: PricingPhaseLike[]
): number {
  if (!isFirstPhaseFreeTrial(phases)) return 0;
  const first = phases[0];
  const cycleCount = Number(first.billingCycleCount ?? 1);
  if (cycleCount <= 0) return 0;
  const periodDays = parseBillingPeriodToDays(first.billingPeriod);
  if (periodDays != null) return periodDays * cycleCount;
  return 0;
}

/** ISO 8601 billing period (e.g. P7D, P1W, P1M) → approximate trial days for UI copy. */
export function parseBillingPeriodToDays(
  period: string | undefined
): number | null {
  const trimmed = period?.trim();
  if (!trimmed) return null;

  const match = trimmed.match(
    /^P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)W)?(?:(\d+)D)?$/i
  );
  if (!match) return null;

  const years = Number(match[1] ?? 0);
  const months = Number(match[2] ?? 0);
  const weeks = Number(match[3] ?? 0);
  const days = Number(match[4] ?? 0);
  const total = years * 365 + months * 30 + weeks * 7 + days;
  return total > 0 ? total : null;
}

function trialDaysFromPhaseList(phases: PricingPhaseLike[]): number {
  for (const phase of phases) {
    const micros = Number(phase.priceAmountMicros ?? -1);
    if (micros !== 0) continue;

    const cycleCount = Number(phase.billingCycleCount ?? 1);
    if (cycleCount <= 0) continue;

    const periodDays = parseBillingPeriodToDays(phase.billingPeriod);
    if (periodDays != null) return periodDays * cycleCount;

    if (cycleCount === 1) return 0;
  }
  return 0;
}

function collectAndroidSubscriptionPhaseLists(
  product: ProductLike
): PricingPhaseLike[][] {
  return collectNormalizedAndroidSubscriptionOffers(product).map(
    (offer) => offer.phases
  );
}

type SelectionReason =
  | "preferred-base-plan-trial"
  | "other-trial"
  | "preferred-base-plan-paid"
  | "other-paid"
  | "prefer-paid-user-ineligible"
  | "fallback-first-token";

function countRawAndroidSubscriptionOfferSources(product: ProductLike): {
  subscriptionOffers: number;
  subscriptionOfferDetailsAndroid: number;
  subscriptionOfferDetails: number;
  normalized: number;
} {
  const subscriptionOffers = Array.isArray(product.subscriptionOffers)
    ? product.subscriptionOffers.length
    : 0;
  const subscriptionOfferDetailsAndroid = Array.isArray(
    product.subscriptionOfferDetailsAndroid
  )
    ? product.subscriptionOfferDetailsAndroid.length
    : 0;
  const subscriptionOfferDetails = Array.isArray(
    product.subscriptionOfferDetails
  )
    ? product.subscriptionOfferDetails.length
    : 0;
  return {
    subscriptionOffers,
    subscriptionOfferDetailsAndroid,
    subscriptionOfferDetails,
    normalized: collectNormalizedAndroidSubscriptionOffers(product).length,
  };
}

function deriveSelectionReason(params: {
  selected: NormalizedAndroidSubscriptionOffer;
  trialOffers: NormalizedAndroidSubscriptionOffer[];
  paidOffers: NormalizedAndroidSubscriptionOffer[];
  preferredBasePlanId: string | null;
  preferPaidOffer: boolean;
}): SelectionReason {
  const {
    selected,
    trialOffers,
    paidOffers,
    preferredBasePlanId,
    preferPaidOffer,
  } = params;
  const matchesPreferred =
    preferredBasePlanId != null && selected.basePlanId === preferredBasePlanId;

  if (preferPaidOffer && paidOffers.length > 0) {
    return "prefer-paid-user-ineligible";
  }
  if (trialOffers.length > 0 && !preferPaidOffer) {
    return matchesPreferred ? "preferred-base-plan-trial" : "other-trial";
  }
  if (paidOffers.length > 0) {
    return matchesPreferred ? "preferred-base-plan-paid" : "other-paid";
  }
  return "fallback-first-token";
}

function logStoreTrialStateDebug(
  product: ProductLike,
  selected: SelectedAndroidSubscriptionOffer | null
): void {
  const productId = (product.id as string | undefined) ?? "unknown";
  console.log("[IAP-DEBUG] store trial state", {
    productId,
    isTrial: selected?.isTrial ?? false,
    trialDays: selected?.trialDays ?? 0,
    basePlanId: selected?.basePlanId ?? null,
    offerId: selected?.offerId ?? null,
  });
}

export function logAndroidSubscriptionOfferSelectionDebug(
  product: ProductLike,
  selected: SelectedAndroidSubscriptionOffer | null,
  context?: {
    offers: NormalizedAndroidSubscriptionOffer[];
    trialOffers: NormalizedAndroidSubscriptionOffer[];
    selectionReason: SelectionReason | null;
  }
): void {
  const productId = (product.id as string | undefined) ?? "unknown";
  const offers =
    context?.offers ?? collectNormalizedAndroidSubscriptionOffers(product);
  const sourceCounts = countRawAndroidSubscriptionOfferSources(product);

  console.log("[IAP-DEBUG] subscription offer sources", sourceCounts);

  for (const offer of offers) {
    const first = offer.phases[0];
    const offerIsTrial = isFirstPhaseFreeTrial(offer.phases);
    console.log("[IAP-DEBUG] subscription offer candidate", {
      productId,
      basePlanId: offer.basePlanId,
      offerId: offer.offerId,
      hasOfferToken: Boolean(offer.offerToken),
      source: offer.source,
      firstPhasePriceMicros: first?.priceAmountMicros ?? null,
      firstPhaseFormattedPrice: first?.formattedPrice ?? null,
      firstPhaseBillingPeriod: first?.billingPeriod ?? null,
      firstPhaseBillingCycleCount: first?.billingCycleCount ?? null,
      firstPhaseRecurrenceMode: first?.recurrenceMode ?? null,
      isTrial: offerIsTrial,
      trialDays: offerIsTrial ? trialDaysFromOfferFirstPhase(offer.phases) : 0,
      pricingPhaseCount: offer.phases.length,
    });
  }

  const trialOffers =
    context?.trialOffers ??
    offers.filter((o) => isFirstPhaseFreeTrial(o.phases));
  if (offers.length > 0 && trialOffers.length === 0) {
    console.warn("[IAP-DEBUG] NO TRIAL OFFER DETECTED", {
      productId,
      offerCount: offers.length,
      offers: offers.map((offer) => {
        const first = offer.phases[0];
        return {
          basePlanId: offer.basePlanId,
          offerId: offer.offerId,
          firstPhasePriceMicros: first?.priceAmountMicros ?? null,
          firstPhaseBillingPeriod: first?.billingPeriod ?? null,
          isTrial: isFirstPhaseFreeTrial(offer.phases),
        };
      }),
    });
  }

  if (selected) {
    console.log("[IAP-DEBUG] SELECTED OFFER", {
      productId,
      basePlanId: selected.basePlanId,
      offerId: selected.offerId,
      isTrial: selected.isTrial,
      trialDays: selected.trialDays,
      hasOfferToken: Boolean(selected.offerToken),
      selectionReason: context?.selectionReason ?? null,
    });
  } else {
    console.warn("[IAP-DEBUG] SELECTED OFFER none", { productId });
  }
}

function pickAndroidSubscriptionOfferCandidate(
  offers: NormalizedAndroidSubscriptionOffer[],
  trialOffers: NormalizedAndroidSubscriptionOffer[],
  paidOffers: NormalizedAndroidSubscriptionOffer[],
  preferredBasePlanId: string | null,
  preferPaidOffer: boolean
): NormalizedAndroidSubscriptionOffer | null {
  if (preferPaidOffer) {
    const paidOnly = paidOffers.length > 0 ? paidOffers : [];
    if (paidOnly.length > 0) {
      return pickPreferredOffer(paidOnly, null);
    }
  } else if (trialOffers.length > 0) {
    return pickPreferredOffer(trialOffers, preferredBasePlanId);
  }

  return pickPreferredOffer(
    paidOffers.length > 0 ? paidOffers : offers,
    preferPaidOffer ? null : preferredBasePlanId
  );
}

/**
 * Pick the Android subscription offer Google Play returned for this product/account.
 * Prefers a free-trial first phase when the user is eligible; among trials prefers
 * the configured base plan ID. Falls back to a paid recurring offer otherwise.
 */
export function selectAndroidSubscriptionOffer(
  product: ProductLike,
  options?: SelectAndroidSubscriptionOfferOptions
): SelectedAndroidSubscriptionOffer | null {
  const productId = (product.id as string | undefined) ?? undefined;
  const preferredBasePlanId = preferredBasePlanIdForProduct(productId);
  const preferPaidOffer = options?.preferPaidOffer === true;
  const offers = collectNormalizedAndroidSubscriptionOffers(product);
  if (!offers.length) return null;

  const trialOffers = offers.filter((o) => isFirstPhaseFreeTrial(o.phases));
  const paidOffers = offers.filter(
    (o) => o.phases.length > 0 && !isFirstPhaseFreeTrial(o.phases)
  );

  const selected = pickAndroidSubscriptionOfferCandidate(
    offers,
    trialOffers,
    paidOffers,
    preferredBasePlanId,
    preferPaidOffer
  );

  if (!selected) return null;

  const isTrial = isFirstPhaseFreeTrial(selected.phases);
  const trialDays = isTrial ? trialDaysFromOfferFirstPhase(selected.phases) : 0;

  const result: SelectedAndroidSubscriptionOffer = {
    offerToken: selected.offerToken,
    basePlanId: selected.basePlanId,
    offerId: selected.offerId,
    isTrial,
    trialDays,
  };

  if (options?.logSelection) {
    logAndroidSubscriptionOfferSelectionDebug(product, result, {
      offers,
      trialOffers,
      selectionReason: deriveSelectionReason({
        selected,
        trialOffers,
        paidOffers,
        preferredBasePlanId,
        preferPaidOffer,
      }),
    });
  }

  return result;
}

/** Pricing phases for the offer selected for purchase/display. */
export function getAndroidSelectedOfferPricingPhases(
  product: ProductLike,
  options?: SelectAndroidSubscriptionOfferOptions
): PricingPhaseLike[] {
  const offers = collectNormalizedAndroidSubscriptionOffers(product);
  const selected = selectAndroidSubscriptionOffer(product, {
    logSelection: false,
    preferPaidOffer: options?.preferPaidOffer,
  });
  if (!selected) return [];
  return offers.find((o) => o.offerToken === selected.offerToken)?.phases ?? [];
}

function hasAndroidSubscriptionOffers(product: ProductLike): boolean {
  return collectNormalizedAndroidSubscriptionOffers(product).length > 0;
}

/**
 * Trial length from Play Billing / StoreKit product details.
 * Android uses the same offer selection as purchase; iOS uses StoreKit introductory offers.
 */
export function getStoreTrialDaysFromProduct(product: ProductLike): number {
  if (hasAndroidSubscriptionOffers(product)) {
    const selected = selectAndroidSubscriptionOffer(product, {
      logSelection: false,
    });
    logStoreTrialStateDebug(product, selected);
    return selected?.trialDays ?? 0;
  }

  for (const phases of collectAndroidSubscriptionPhaseLists(product)) {
    const days = trialDaysFromPhaseList(phases);
    if (days > 0) return days;
  }

  const offers = product.subscriptionOffers as
    | Array<{
        paymentMode?: string;
        subscriptionPeriodUnitIOS?: string;
        subscriptionPeriodNumberIOS?: string | number;
        introductoryPricePaymentModeIOS?: string;
        introductoryPriceNumberOfPeriodsIOS?: string | number;
        introductoryPriceSubscriptionPeriodIOS?: string;
      }>
    | undefined;

  for (const offer of offers ?? []) {
    const paymentMode = (
      offer.paymentMode ??
      offer.introductoryPricePaymentModeIOS ??
      ""
    )
      .toString()
      .toLowerCase();
    if (paymentMode !== "freetrial" && paymentMode !== "free_trial") continue;

    const unit = (
      offer.subscriptionPeriodUnitIOS ??
      offer.introductoryPriceSubscriptionPeriodIOS ??
      ""
    )
      .toString()
      .toLowerCase();
    const count = Number(
      offer.subscriptionPeriodNumberIOS ??
        offer.introductoryPriceNumberOfPeriodsIOS ??
        0
    );
    if (!(count > 0)) continue;

    switch (unit) {
      case "day":
        return count;
      case "week":
        return count * 7;
      case "month":
        return count * 30;
      case "year":
        return count * 365;
      default:
        break;
    }
  }

  return 0;
}
