import type { PlanId } from "../../../config/subscriptionConfig";

export type SubscriptionPlanKind = "week" | "month" | "year" | "lifetime" | "unknown";

export function getPlanKindFromId(
  planId?: string | null
): SubscriptionPlanKind {
  if (!planId) return "unknown";
  const id = planId.toLowerCase();
  if (id.includes("lifetime")) return "lifetime";
  if (id.includes("weekly") || id.includes("week")) return "week";
  if (id.includes("monthly") || id.includes("month")) return "month";
  if (id.includes("yearly") || id.includes("year")) return "year";
  return "unknown";
}

export function getPlanStatusTitle(kind: SubscriptionPlanKind): string {
  switch (kind) {
    case "week":
      return "Weekly Plan";
    case "month":
      return "Monthly Plan";
    case "year":
      return "Yearly Plan";
    case "lifetime":
      return "Life-time Plan";
    default:
      return "Premium Plan";
  }
}

export function formatSubscriptionSinceLabel(
  dateStr?: string | null
): string | null {
  if (!dateStr) return null;
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) return null;
  return `Since ${parsed.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  })}`;
}

export function estimateRenewalDate(
  subscriptionDate: string | null | undefined,
  kind: SubscriptionPlanKind
): Date | null {
  if (kind === "lifetime" || kind === "unknown") return null;

  const base = subscriptionDate ? new Date(subscriptionDate) : new Date();
  if (Number.isNaN(base.getTime())) return null;

  const renewal = new Date(base.getTime());

  while (renewal.getTime() <= Date.now()) {
    if (kind === "week") {
      renewal.setDate(renewal.getDate() + 7);
    } else if (kind === "month") {
      renewal.setMonth(renewal.getMonth() + 1);
    } else {
      renewal.setFullYear(renewal.getFullYear() + 1);
    }
  }

  return renewal;
}

export function getPreviewRenewalDate(): Date {
  const renewal = new Date();
  renewal.setDate(renewal.getDate() + 364);
  renewal.setHours(renewal.getHours() + 12);
  renewal.setMinutes(renewal.getMinutes() + 20);
  renewal.setSeconds(renewal.getSeconds() + 20);
  return renewal;
}

export function getRemainingRenewalTime(renewalDate: Date) {
  const diff = Math.max(0, renewalDate.getTime() - Date.now());
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { days, hours, minutes, seconds };
}

/** Weekly / Monthly / Yearly subscribers can switch; lifetime cannot. */
export function canSwitchPlan(kind: SubscriptionPlanKind): boolean {
  return kind === "week" || kind === "month" || kind === "year";
}

/** Short-term subscribers only see upgrade paths (yearly + lifetime). */
export function isShortTermUpgradeSheet(kind: SubscriptionPlanKind): boolean {
  return kind === "week" || kind === "month";
}

/** @deprecated Use isShortTermUpgradeSheet */
export function isMonthlyUpgradeSheet(kind: SubscriptionPlanKind): boolean {
  return isShortTermUpgradeSheet(kind);
}

export function getSwitchPlanFooterTitle(kind: SubscriptionPlanKind): string {
  return isShortTermUpgradeSheet(kind) ? "Upgrade" : "Switch Plan";
}

export function getSwitchSheetTitle(kind: SubscriptionPlanKind): string {
  return isShortTermUpgradeSheet(kind) ? "Upgrade" : "Switch to";
}

export function getSwitchOptionCardTitle(
  targetDuration: string,
  currentKind: SubscriptionPlanKind,
  fallback: string
): string {
  const duration = targetDuration.toLowerCase();
  if (currentKind === "week" || currentKind === "month") {
    if (duration === "year") return "Upgrade to yearly plan";
    if (duration === "lifetime") return "Upgrade to Lifetime plan";
  }
  if (duration === "week") return "Weekly";
  if (duration === "month") return "Monthly";
  if (duration === "year") return "Yearly";
  if (duration === "lifetime") return "Life-time";
  return fallback;
}

/** Packs offered in the switch bottom sheet for the active plan. */
export function getSwitchSheetPlansForCurrentKind<
  T extends { id: string; duration?: string }
>(plans: T[], currentPlanKind: SubscriptionPlanKind): T[] {
  const targetDurations: string[] | null =
    currentPlanKind === "week" || currentPlanKind === "month"
      ? ["year", "lifetime"]
      : currentPlanKind === "year"
      ? ["month", "lifetime"]
      : null;

  if (!targetDurations) return [];

  const result: T[] = [];
  for (const duration of targetDurations) {
    const plan = plans.find(
      (p) => (p.duration ?? "").toLowerCase() === duration
    );
    if (plan) result.push(plan);
  }
  return result;
}

export function planMatchesKind(
  plan: { duration?: string },
  kind: SubscriptionPlanKind
): boolean {
  return (plan.duration ?? "").toLowerCase() === kind;
}

export function getSwitchPlanCtaLabel(
  selectedPlan:
    | {
        duration?: string;
        priceDisplay?: string;
      }
    | undefined,
  isPurchasing: boolean
): string {
  if (isPurchasing) return "Processing…";
  const priceDisplay = selectedPlan?.priceDisplay?.trim();
  if (!priceDisplay || priceDisplay === "—") return "Subscribe";

  const duration = (selectedPlan?.duration ?? "").toLowerCase();
  if (duration === "week" || duration === "lifetime") return "Continue";
  if (duration === "year") return `Subscribe for ${priceDisplay}/year`;
  if (duration === "month") return `Subscribe for ${priceDisplay}/month`;
  return `Subscribe for ${priceDisplay}`;
}

export function resolveCurrentPlanId(
  subscriptionPlanId?: string | null,
  localPlanId?: PlanId | null
): PlanId | null {
  return (subscriptionPlanId ?? localPlanId ?? null) as PlanId | null;
}
