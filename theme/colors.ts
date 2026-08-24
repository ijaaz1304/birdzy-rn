/**
 * App token colors (outside `src`).
 *
 * Keep this file as the source of truth for app-level semantic colors that are
 * not part of the design-system palette.
 *
 * Note: `src/config/colors.ts` re-exports `APP_COLORS` from here so existing
 * imports keep working.
 */

export const APP_COLORS = {
  // Modals & overlays
  overlay: 'rgba(0,0,0,0.5)',
  overlayLight: 'rgba(0,0,0,0.4)',
  overlayDim: 'rgba(0,0,0,0.45)',
  overlayCloseButton: 'rgba(255,255,255,0.2)',
  blurOverlayLight: 'rgba(255,255,255,0.25)',
  /** @deprecated Prefer blurOverlayFallback — kept for onboarding / image overlays. */
  blurOverlayLightFallback: 'rgba(255,255,255,0.6)',
  /** Premium-gated blur (matches InsectoAI). iOS fallback + Android glass tint. */
  blurOverlayFallback: 'rgba(255, 255, 255, 0.72)',
  blurOverlay0: 'rgba(255, 255, 255, 0.45)',
  blurOverlay1: 'rgba(255, 255, 255, 0.62)',
  blurOverlay2: 'rgba(255, 255, 255, 0.78)',
  blurOverlayGlass0: 'rgba(255, 255, 255, 0.58)',
  blurOverlayGlass1: 'rgba(255, 255, 255, 0.74)',
  blurOverlayGlass2: 'rgba(255, 255, 255, 0.88)',
  blurOverlayBorder: 'rgba(255, 255, 255, 0.3)',
  /** Figma 9170:26325 — premium-gated content blur tint layers (dark). */
  premiumGateBlurTintDark0: 'rgba(0, 0, 0, 0.1)',
  premiumGateBlurTintDark1: 'rgba(237, 237, 237, 0.05)',
  /** iOS/Android fallback when native blur is unavailable (dark premium gate). */
  premiumGateBlurFallbackDark: 'rgba(17, 17, 17, 0.55)',

  // Modal / bottom sheet (theme-aware: use dark variant in dark mode, light in light mode)
  modalBackdropDark: 'rgba(0,0,0,0.7)',
  modalBackdropLight: 'rgba(0,0,0,0.55)',
  modalSheetBgDark: 'rgba(17,17,17,0.98)',
  modalSheetBgLight: 'rgba(255,255,255,0.98)',
  modalCloseButtonBgDark: 'rgba(255,255,255,0.2)',
  modalCloseButtonBgLight: 'rgba(0,0,0,0.08)',
  modalMineralOfTheDayBackdropDark: 'rgba(0,0,0,0.82)',
  modalMineralOfTheDayBackdropLight: 'rgba(0,0,0,0.75)',
  modalMineralOfTheDayCloseBorder: 'rgba(255,255,255,0.6)',
  modalTextOnPrimary: '#FFFFFF',
  modalRibbonWarning: '#F0A83A',
  modalRefreshButtonBg: '#666666',
  modalSuccessButtonBg: '#3A7D44',
  modalEmojiSelectedBg: '#FFA726',
  modalCheckIconOnSuccess: '#FFFFFF',

  /** Primary CTA button fill — light and dark mode */
  ctaPrimary: '#725481',

  /** Pagination dot — selected / unselected (light mode) */
  paginationDotSelectedLight: '#01474F',
  paginationDotUnselectedLight: 'rgba(1, 71, 79, 0.2)',

  /** Splash + native launch screen background */
  splashBackground: '#01474F',

  // Brand — Mushroom app (Figma Brand 1 orange + Brand 2 earth brown)
  brandPrimary: '#FDBE62',
  brandPrimaryDark: '#C7630C',
  brandLight: '#F7E6CD',
  brandDarkBg: '#513103',

  // Upgrade / premium modal (gradient and CTAs)
  upgradeGradientStart: '#DA64B0',
  upgradeGradientEnd: '#2E19AA',
  upgradeCtaText: '#34228F',

  // Mushroom of the day (cards, tags, CTAs)
  mineralOfDayTitle: '#4D3221',
  mineralOfDayTagBg: '#F7E6CD',
  mineralOfDayTagText: '#C7630C',
  mineralOfDayDotActive: '#C7630C',
  mineralOfDayLearnMoreBg: '#4D3221',
  mineralOfDayOpenButton: '#159945',
  textPrimaryDark: '#1E1E1F',
  textSecondary: '#606062',

  // Surfaces (when theme not available, e.g. static styles)
  surfaceWhite: '#fff',
  surfaceDark: '#111111',
  surfacePlaceholder: '#f0f0f0',
  borderLight: '#E5E5E5',
  borderDark: '#333333',
  borderDarkLighter: '#444444',

  /** Cancel / No Thanks / Ignore button border in popups & bottom sheets: light #E7E7E7, dark #333 */
  cancelSecondaryBorderLight: '#E7E7E7',
  cancelSecondaryBorderDark: '#333333',
  surfaceAuthLight: '#F6F6F6',
  surfaceAuthDark: '#171717',

  // Shadows / neutrals
  shadowBlack: '#000000',

  // Promo cards (AppPromoCard variants)
  promoCardBlueBg: '#D7E5F0',
  promoCardCreamBg: '#F9F4ED',
  promoCardSoilBg: '#EBE6DB',
  promoCardSoilSubText: '#5C5048',
  promoCardGradientStart: 'rgba(255,255,255,0)',
  promoCardGradientMid: 'rgba(250,250,250,0.3)',
  promoCardAskGradientStart: '#F7E6CD',

  // Error / destructive
  error: '#EF4444',
  errorLightBg: '#FEF2F2',

  // Text muted (descriptions, secondary)
  textMuted: '#555',
  textMutedDark: '#666',
  textSecondaryGray: '#5D5D5D',

  // Surfaces / borders (extended)
  surfaceBrownDark: '#4D3221',
  surfaceBrownLight: '#F7E6CD',
  borderGray: '#B0B0B0',
  borderGrayLight: '#E0E0E0',
  surfaceDarkAlt: '#2A2A2A',
  surfaceLightAlt: '#F0F0F0',
  surfaceDarkMuted: '#1a1a1a',
  iconBgDark: '#6D6D6D',
  linkBlue: '#007AFF',
  brandLightBlue: '#FCB182',
  errorDark: '#B91C1C',
  borderBrown: '#3D3630',

  // Blur / overlay (white/dark alpha)
  blurOverlayWhite40: 'rgba(255,255,255,0.4)',
  blurOverlayWhite35: 'rgba(255,255,255,0.35)',
  blurOverlayWhite50: 'rgba(255,255,255,0.5)',
  blurOverlayWhite10: 'rgba(255,255,255,0.10)',
  overlayDark12: 'rgba(0,0,0,0.12)',
  overlayDark30: 'rgba(0,0,0,0.3)',
  errorBgAlpha: 'rgba(239,68,68,0.10)',
  promoGradientTransparent: 'rgba(199,187,157,0)',
  promoGradientOverlay: 'rgba(199,187,157,0.2)',
  blurOverlayWhite15: 'rgba(255,255,255,0.15)',
  overlayBlack06: 'rgba(0,0,0,0.06)',
  blurOverlayWhite30: 'rgba(255,255,255,0.3)',

  // Ask AI promo card gradient end (brand + alpha)
  promoCardAskGradientEndLight: '#C7630C01',
  promoCardAskGradientEndDark: '#FDBE6201',

  // Tooltip (AppLogsTooltip)
  tooltipTextLight: 'rgba(209, 209, 209, 1)',
  tooltipTextDark: 'rgba(93, 93, 93, 1)',

  // Blur / overlay (extended)
  blurOverlayWhite45: 'rgba(255,255,255,0.45)',
  blurOverlayWhite70: 'rgba(255,255,255,0.7)',
  blurOverlayWhite80: 'rgba(255, 255, 255, 0.8)',
  blurOverlayWhite95: 'rgba(255,255,255,0.95)',

  // Mushroom of the day banner gradients
  rockBannerBrown: '#4D3221',
  rockBannerDarkAlpha: 'rgba(77,50,33,0.5)',
  rockBannerBrownAlpha: 'rgba(199,99,12,0.35)',
  rockBannerCream: '#F7E6CD',
  rockBannerCreamAlpha: 'rgba(247,230,205,0.5)',
  rockBannerPeachAlpha: 'rgba(252,177,130,0.6)',

  // Plan card shadow
  planCardShadowBlue: 'rgba(199, 99, 12, 0.35)',

  // Mineral detail shadow
  mineralShadowOlive: 'rgba(199, 99, 12, 0.35)',

  // Overlays
  overlayGray15: 'rgba(128,128,128,0.15)',

  // Guides
  guideGreenDefault: '#159945',
  guideCardDark: '#21190B',

  // Borders
  borderMuted: '#606970',

  // Onboarding (brand solid)
  brandPrimaryDarkRgb: 'rgba(199, 99, 12, 1)',

  // Mushroom personality gradient
  rockPersonalityStart: '#F7E6CD',
  rockPersonalityEnd: '#C7630C',

  // Subscription sheet
  subscriptionDiscountTimer: '#FCB30D',
  subscriptionDiscountBg: '#FDBE62',
  subscriptionPremium: '#A47758',
  subscriptionMuted: '#949494',

} as const;
