/**
 * Subscription Status Data
 */

export interface ActiveSubscription {
  plan: "monthly" | "annual" | "lifetime";
  startDate: string; // ISO
  renewalDate?: string; // ISO (null for lifetime)
  benefits: string[];
}

/** Default benefits list for subscription UI when user is not subscribed. */
export const DEFAULT_SUBSCRIPTION_BENEFITS: string[] = [
  "Identify birds without any limits",
  "Create and save unlimited collections",
  "Access complete bird info anytime",
  "Post without limits in the feed",
  "Get multiple birds of the day",
  "Send unlimited storage",
  "Unlock unlimited Bird Sounds",
  "Send unlimited messages with AI chatbot",
];

/** Default subscription display for status screen when user is not subscribed. */
export const getDefaultActiveSubscription = (): ActiveSubscription => ({
  plan: "annual",
  startDate: new Date().toISOString().slice(0, 10),
  renewalDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10),
  benefits: DEFAULT_SUBSCRIPTION_BENEFITS,
});

/**
 * Calculate remaining time until renewal date
 */
export const getRemainingTime = (renewalDate: string) => {
  const diff = new Date(renewalDate).getTime() - Date.now();

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return { days, hours, minutes, seconds };
};
