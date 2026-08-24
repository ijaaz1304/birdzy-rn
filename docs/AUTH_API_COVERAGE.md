# Auth API coverage

Maps the Trackzio **Auth Module** backend spec to this app's implementation.

**Canonical paths:** `src/constants/api.ts` → `API_ENDPOINTS.AUTH`  
**HTTP client:** `src/services/api/features/auth.api.ts`  
**Business logic:** `src/features/auth/services/auth.service.ts`  
**App state:** `src/features/auth/auth.store.ts` (`useAuthStore`)

---

## Endpoint coverage

| Backend endpoint | Method | `authApi` | `authService` | `useAuthStore` | UI / notes |
|------------------|--------|-----------|---------------|----------------|------------|
| `/auth/signup` | POST | ✅ | ✅ | ✅ `signup` | `SignUpScreen` (email form); passes `guestId` when promoting guest |
| `/auth/login` | POST | ✅ | ✅ | ✅ `login` | `LoginScreen` |
| `/auth/refresh-auth-token` | GET | ✅ | ✅ | ✅ `refreshAuthToken` | Axios 401 interceptor; **not used for guests** (guests use guest-login) |
| `/auth/social-login/google` | POST | ✅ | ✅ | ✅ `socialLoginGoogle` | Login / Sign up screens |
| `/auth/social-login/apple` | POST | ✅ | ✅ | ✅ `socialLoginApple` | Login / Sign up screens |
| `/auth/guest-login` | POST | ✅ | ✅ | ✅ `guestLogin` | Onboarding, Login, Sign up; uses `fetch` (no auth header) |
| `/auth/forgot-password` | POST | ✅ | ✅ | ✅ `forgotPassword` | `ForgotPasswordScreen` |
| `/auth/reset-password` | POST | ✅ | ✅ | ✅ `resetPassword` | `CreateNewPasswordScreen`; deep link `birdzy://reset-password` |
| `/auth/me` | GET | ✅ | ✅ | ✅ `getProfile`, `refreshProfileSilent*` | Settings, post-login refresh schedule |
| `/auth/me` | PATCH | ✅ | ✅ | ✅ `updateProfile` | `CompleteProfileScreen`, `ProfileSettingsScreen` |
| `/auth/me` | DELETE | ✅ | ✅ | ✅ `deleteProfile` | Settings → delete account |
| `/auth/resend-verification-mail` | POST | ✅ | ✅ | ✅ `resendVerificationEmail` | `VerifyEmailScreen` |
| `/auth/referrals` | GET | ✅ | ✅ | ✅ `getReferrals` | API ready; **no dedicated UI screen yet** |
| `/auth/referrals` | POST | ✅ | ✅ | ✅ `useReferralCode` | API ready; **no dedicated UI screen yet** |
| `/auth/subscribe/google` | PUT | ✅ | ✅ | ✅ `subscribeGoogle` | IAP purchase flow |
| `/auth/unsubscribe/google` | DELETE | ✅ | ✅ | ✅ `unsubscribeGoogle` | Restore / entitlement sync; optional `removeLifetimePurchase` query |
| `/auth/subscribe/apple` | PUT | ✅ | ✅ | ✅ `subscribeApple` | IAP purchase flow |
| `/auth/unsubscribe/apple` | DELETE | ✅ | ✅ | ✅ `unsubscribeApple` | Restore / entitlement sync |
| `/auth/parse-google-purchasetoken` | POST | ✅ | ✅ | ✅ `parseGooglePurchaseToken` | Debug/validation; not used in production UI |

**All 18 documented auth endpoints are implemented.**

---

## Request / response types

Types live in `src/services/api/features/auth.api.types.ts`:

- `SignupRequest`, `LoginRequest`, `SocialLoginRequest`, `GuestLoginRequest`
- `ForgotPasswordRequest`, `ResetPasswordRequest`, `ResetPasswordResponse`
- `UpdateProfileRequest`, `UseReferralCodeRequest`
- `GoogleSubscriptionRequest`, `AppleSubscriptionRequest`
- `ParseGooglePurchaseTokenRequest`
- `BackendUser`, `AuthResponse`, `GuestLoginResponse`, `RefreshTokenResponse`
- `GetUserProfileResponse` (includes optional `discount`)
- `ReferralResponse`, `SubscriptionResponse`, `ParsePurchaseTokenResponse`

---

## Auth flows wired in the app

1. **Guest → registered:** `guestId` stored in auth store; passed on `signup`, Google, and Apple login to promote guest.
2. **Token refresh:** Non-guest → `GET /auth/refresh-auth-token`. Guest → `POST /auth/guest-login` with stored `guestId`.
3. **Password reset:** `forgot-password` sends OTP; `reset-password` uses `token` + `email` + `password`.
4. **Subscriptions:** After Google/Apple subscribe or unsubscribe, store refreshes JWT and calls `GET /auth/me`.

---

## Gaps (product / infra, not API client)

| Item | Status |
|------|--------|
| Referral UI (show code, apply code) | Not built — store methods exist |
| `parseGooglePurchaseToken` in dev tools | Optional debug screen only |
| Backend `APP_CODE` (`Mushrooms` / `MushroomsDev`) | Must match server for notifications |
| Email reset links | Backend must use `birdzy://reset-password?email=&code=` |

---

## Related files

- `src/navigation/AuthStack.tsx` — auth screens
- `src/services/auth/socialLogin.service.ts` — Google/Apple native SDK → credential
- `src/features/auth/utils/authDeepLinks.ts` — password reset URL parsing
- `src/services/api/axios.ts` — Bearer token + 401 refresh queue
