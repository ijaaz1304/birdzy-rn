/**
 * Subscription Paywall & Plan Modal tests
 * - Config is single source of truth (paywall title, comparison rows, plans, default plan)
 * - Countdown prefix and duration from config
 * Manual: Paywall light/dark, comparison table from config, modal open/close, default plan, CTA text
 */

jest.mock('../../src/constants/env', () => ({
  GOOGLE_MAPS_API_KEY: 'test-key',
  SUBSCRIPTION_VALUE: 'https://example.com/packs.json',
}));

import {
  subscriptionConfig,
  getAllSubscriptionPlans,
} from '../../src/config/subscriptionConfig';

describe('subscriptionConfig', () => {
  it('provides paywall title from config', () => {
    expect(subscriptionConfig.paywallTitle).toBe(
      'Get 50% Off — Unlock Advanced Capabilities',
    );
  });

  it('provides feature comparison rows', () => {
    expect(subscriptionConfig.featureComparison.length).toBeGreaterThan(0);
    expect(subscriptionConfig.featureComparison[0]).toHaveProperty('feature');
    expect(subscriptionConfig.featureComparison[0]).toHaveProperty('free');
    expect(subscriptionConfig.featureComparison[0]).toHaveProperty('premium');
  });

  it('provides plans with default selected', () => {
    const plans = getAllSubscriptionPlans();
    expect(plans.length).toBeGreaterThanOrEqual(3);
    expect(subscriptionConfig.defaultSelectedPlanId).toBeDefined();
    const yearly = plans.find(
      p =>
        p.id === 'yearly' || p.id.includes('yearly') || p.duration === 'year',
    );
    expect(yearly).toBeDefined();
  });
});

describe('comparison table data from config', () => {
  it('exposes rows and headers for table', () => {
    expect(subscriptionConfig.featureComparison.length).toBeGreaterThan(0);
    expect(subscriptionConfig.comparisonHeaders.feature).toBe('Feature');
    expect(subscriptionConfig.comparisonHeaders.free).toBe('Free');
    expect(subscriptionConfig.comparisonHeaders.premium).toBe('Premium');
  });
});

describe('CountdownPill', () => {
  it('uses countdown prefix from config', () => {
    expect(subscriptionConfig.countdownPrefix).toBe('Discount ends in');
  });

  it('uses countdown duration from config', () => {
    const d = subscriptionConfig.countdownDuration;
    expect(d).toHaveProperty('hours');
    expect(d).toHaveProperty('minutes');
    expect(d).toHaveProperty('seconds');
  });
});

/*
 * Manual testing checklist (documented):
 * - Navigate to paywall (Subscription tab -> main screen)
 * - Open plan modal via "Start my free trial"
 * - Switch plans (Monthly / Annual / Lifetime) and verify CTA text updates
 * - Close modal via X or backdrop
 * - Toggle dark mode in settings and verify paywall text, prices, layout
 * - Tap "Later" to dismiss paywall
 */
