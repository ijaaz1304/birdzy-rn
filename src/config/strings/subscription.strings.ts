/**
 * Subscription Strings
 * Note: Most subscription strings are in subscription.config.ts
 * This file contains additional UI strings
 */

export const SUBSCRIPTION_STRINGS = {
  screen: {
    title: "Subscription",
    intro: "Subscription",
    plans: "Subscription Plans",
  },
  status: {
    subscribed: "Already Subscribed",
    currentPlan: "Current plan: {tier}",
    choosePlan: "Choose a plan that works for you",
  },
  buttons: {
    subscribe: "Subscribe",
    currentPlan: "Current Plan",
    manageSubscription: "Manage Subscription",
  },
  alreadySubscribed: {
    title: "Already Subscribed",
    message:
      "You already have an active subscription. Manage it from your account settings.",
  },
  error: {
    purchase: {
      title: "Purchase Failed",
      message: "We couldn't process your subscription. Please try again.",
    },
    restore: {
      title: "Restore Failed",
      message: "We couldn't restore your subscription. Please contact support.",
    },
    network: {
      title: "Network Error",
      message: "Please check your internet connection and try again.",
    },
    unknown: {
      title: "Something Went Wrong",
      message: "An unexpected error occurred. Please try again later.",
    },
  },
} as const;
