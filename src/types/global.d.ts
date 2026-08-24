/**
 * Global TypeScript declarations for React Native (Birdzy).
 */

declare module '@env' {
  export const GOOGLE_MAPS_API_KEY: string;
  export const GOOGLE_GEOCODING_API_BASE_URL: string;
  export const GOOGLE_PLACES_API_BASE_URL: string;
  export const GEOCODING_API_BASE_URL: string;
  export const GEOCODING_API_KEY: string;
  export const API_BASE_URL: string;
  export const MUSHROOMS_API_BASE_URL: string;
  export const MINERALS_API_BASE_URL: string;
  export const NOTIFICATION_BASE_URL: string;
  export const PUBLISHED_APPS: string;
  export const COUNTRIES_JSON: string;
  export const ENV: string;
  export const APP_CODE: string;
  export const GOOGLE_WEB_CLIENT_ID: string;
  export const APP_STORE_ID: string;
  export const PLAY_STORE_ID: string;
  export const SUBSCRIPTION_VALUE: string;
  export const RATING_FEEDBACK_API: string;
  export const APP_SPECIFIC_SHARED_SECRET: string;
  export const APP_SHARED_SECRET: string;
  export const APP_LOGS_SUPPORT_EMAIL: string;
  export const APP_LOGS_ENABLED: string;
  export const META_INSTALL_REFERRER_DECRYPTION_KEY: string;
  export const FACEBOOK_APP_ID: string;
  export const FACEBOOK_CLIENT_TOKEN: string;
  export const FIREBASE_PROJECT_ID: string;
  export const FIREBASE_APP_ID: string;
  export const APP_ENV: string;
}

declare module '*.webp' {
  const value: number;
  export default value;
}

declare module '*.png' {
  const value: number;
  export default value;
}

declare module '*.jpg' {
  const value: number;
  export default value;
}

declare module '*.jpeg' {
  const value: number;
  export default value;
}

declare module '*.gif' {
  const value: number;
  export default value;
}

declare module '*.svg' {
  import type React from 'react';
  import type { SvgProps } from 'react-native-svg';
  const content: React.FC<SvgProps>;
  export default content;
}

declare module '*.mp3' {
  const value: number;
  export default value;
}

declare module '*.mp4' {
  const value: number;
  export default value;
}

declare module '*.json' {
  const value: Record<string, unknown>;
  export default value;
}
