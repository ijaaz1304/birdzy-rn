# Auth Module — API Reference & Birdzy Implementation Map

> Trackzio shared auth API. Birdzy implements **all 19 endpoints** with exact path/method matches.
> Source of truth in code: `src/constants/api.ts`, `src/services/api/features/auth.api.ts`

**Base URL:** `{API_BASE_URL}` — must be set in `.env.dev` / `.env.prod` (currently empty; no default fallback).

---

## Endpoints

| Method | Path | Purpose | Code constant | Implemented |
|--------|------|---------|---------------|-------------|
| POST | `/auth/signup` | Email/password signup (+ guest promotion) | `AUTH.SIGNUP` | ✅ |
| POST | `/auth/login` | Email/password login | `AUTH.LOGIN` | ✅ |
| GET | `/auth/refresh-auth-token` | Exchange JWT for fresh token | `AUTH.REFRESH_TOKEN` | ✅ |
| POST | `/auth/social-login/google` | Google ID token login | `AUTH.SOCIAL_LOGIN_GOOGLE` | ✅ |
| POST | `/auth/social-login/apple` | Apple ID token login | `AUTH.SOCIAL_LOGIN_APPLE` | ✅ |
| POST | `/auth/guest-login` | Create/login guest user | `AUTH.GUEST_LOGIN` | ✅ |
| POST | `/auth/forgot-password` | Send OTP to email | `AUTH.FORGOT_PASSWORD` | ✅ |
| POST | `/auth/reset-password` | Reset password with OTP | `AUTH.RESET_PASSWORD` | ✅ |
| GET | `/auth/me` | Get user profile | `AUTH.GET_PROFILE` | ✅ |
| PATCH | `/auth/me` | Update user profile | `AUTH.UPDATE_PROFILE` | ✅ |
| DELETE | `/auth/me` | Delete account | `AUTH.DELETE_PROFILE` | ✅ |
| POST | `/auth/resend-verification-mail` | Resend email verification | `AUTH.RESEND_VERIFICATION` | ✅ |
| GET | `/auth/referrals` | Get referral code + stats | `AUTH.GET_REFERRALS` | ✅ |
| POST | `/auth/referrals` | Apply referral code | `AUTH.USE_REFERRAL` | ✅ |
| PUT | `/auth/subscribe/google` | Validate Google Play purchase | `AUTH.SUBSCRIBE_GOOGLE` | ✅ |
| DELETE | `/auth/unsubscribe/google` | Unsubscribe Google | `AUTH.UNSUBSCRIBE_GOOGLE` | ✅ |
| PUT | `/auth/subscribe/apple` | Validate Apple receipt | `AUTH.SUBSCRIBE_APPLE` | ✅ |
| DELETE | `/auth/unsubscribe/apple` | Unsubscribe Apple | `AUTH.UNSUBSCRIBE_APPLE` | ✅ |
| POST | `/auth/parse-google-purchasetoken` | Parse Google token (no side effects) | `AUTH.PARSE_GOOGLE_TOKEN` | ✅ |

---

## Request / response mapping

### Signup — `POST /auth/signup`

**Request type:** `SignupRequest` (`auth.api.types.ts`)

```typescript
{
  guestId?: string;
  email: string;
  phone?: string;
  fullName?: string;
  password: string;
  gender?: string;
  country?: string;
  age?: number;
  picture?: string;
}
```

**Response:** `AuthResponse` → `{ error, token, user: BackendUser }`

**Store:** `auth.store.signup()` → `auth.service.signup()` → `authApi.signup()`

---

### Login — `POST /auth/login`

**Request:** `{ handle: string; password: string }` — `handle` is email **or** phone.

**Response:** `AuthResponse`

**Store:** `auth.store.login()`

---

### Refresh token — `GET /auth/refresh-auth-token`

**Headers:** `Authorization: Bearer {currentJWT}` (expired JWT accepted)

**Response:** `{ error, userId, token }`

**Note:** Guest users re-use `POST /auth/guest-login` with `{ guestId }` instead.

**Triggered by:** app start (500ms after hydrate), axios 401/403 interceptor.

---

### Social login — Google / Apple

**Request:** `SocialLoginRequest`

```typescript
{
  credential: string;      // ID token from native SDK
  nonce?: string;          // Apple only
  guestId?: string;
  fullName?: string;
}
```

**Response:** `AuthResponse` + optional `isSignup: boolean`

**Flow:** `socialLogin.service.ts` (native SDK) → `auth.store.socialLoginGoogle/Apple()` → API

---

### Guest login — `POST /auth/guest-login`

**Request:** `{ guestId?: string }`

**Response:** `GuestLoginResponse` → `{ token, guestId, isFirstTime, isSubscribed, guest }`

**Transport:** Uses raw `fetch()` (not axios) to avoid interceptor deadlock on first guest creation.

---

### Forgot / reset password

| Step | Endpoint | Body |
|------|----------|------|
| Request OTP | `POST /auth/forgot-password` | `{ handle }` |
| Reset | `POST /auth/reset-password` | `{ token, password, email }` |

Deep link handler: `src/features/auth/utils/authDeepLinks.ts` (`birdzy://reset-password?email=&code=`)

---

### Profile — `GET/PATCH/DELETE /auth/me`

**GET response:** `{ error, user, token?, discount? }`

**PATCH body:** `UpdateProfileRequest` — password, fullName, phone, picture, country, gender, age, timezone, language, ftueCompletion, sellerDetails

**Profile refresh:** silent refresh on schedule (5min, 10min post-login, hourly throttle)

---

### Referrals

| Endpoint | Role | Response |
|----------|------|----------|
| `GET /auth/referrals` | Referrer (parent) | code, stats, referredUsers |
| `POST /auth/referrals` | Referred (child) | `{ code }` → confirmation |

---

### Subscriptions (auth-validated)

| Platform | Subscribe | Unsubscribe |
|----------|-----------|-------------|
| Google | `PUT /auth/subscribe/google` | `DELETE /auth/unsubscribe/google?removeLifetimePurchase=` |
| Apple | `PUT /auth/subscribe/apple` | `DELETE /auth/unsubscribe/apple` |

**Google body:** `{ purchaseToken, itemId, purchaseTime, isProduct, isLifetimePurchase, includesTrial }`

**Apple body:** `{ receipt, isSandbox }`

**Post-subscribe:** token refresh → `getProfile()` → notification service refresh. Google/Apple subscribe calls retry 3× with backoff.

---

## Type definitions

| File | Contents |
|------|----------|
| `src/services/api/features/auth.api.types.ts` | All request/response types, `BackendUser`, `AuthResponse`, etc. |
| `src/features/auth/auth.store.ts` | Frontend `User` type (mapped from `BackendUser`) |
| `src/features/auth/services/auth.service.ts` | `BackendUser` → `User` mapping, error handling |

### `BackendUser` key fields

`email`, `name.{first,last,full}`, `isGuest`, `isSocial`, `socialProvider`, `isSubscribed`, `isProfileComplete`, `isEmailVerified`, `hasUsedTrial`, `ftueCompletion`, `sellerDetails`, `googlePurchaseData`, `applePurchaseData`, `_id`, `id`

---

## Code architecture

```
Screens (Login, SignUp, etc.)
    ↓
auth.store.ts          ← Zustand + birdzy-auth-storage (AsyncStorage)
    ↓
auth.service.ts        ← mapping, retries, validation
    ↓
auth.api.ts            ← HTTP calls
    ↓
axios.ts               ← Bearer attach, 401 refresh, logging
```

**Native SDK (no HTTP):** `src/services/auth/socialLogin.service.ts`

---

## Birdzy-specific configuration required

| Variable | Purpose | Status |
|----------|---------|--------|
| `API_BASE_URL` | Auth + core API host | **Empty — must configure** |
| `GOOGLE_WEB_CLIENT_ID` | Google Sign-In OAuth | Empty |
| `APP_SHARED_SECRET` | Apple receipt validation | Empty |
| `APP_CODE` | Notification service app identity | Empty |
| `PLAY_STORE_ID` | `com.trackzio.birds[.dev]` | ✅ Set |

---

## Non-standard behaviors (vs typical REST auth)

| Behavior | Detail |
|----------|--------|
| Response envelope | `{ error: boolean }` checked in service layer, not just HTTP status |
| Login identifier | `handle` (email or phone), not `email` |
| Token refresh | GET with current JWT as Bearer — no separate refresh token |
| Guest refresh | Re-posts to `/auth/guest-login` with stored `guestId` |
| No server logout | Client clears `birdzy-auth-storage` only |
| Profile token rotation | GET/PATCH `/auth/me` may return new `token` in body |
| Subscribe method | PUT (not POST) under `/auth/subscribe/*` |
| Stale Bearer stripped | Login/signup/guest/social requests omit existing Authorization header |

---

## What's NOT needed for auth migration

The auth **API layer requires no endpoint or type changes** for Birdzy. Migration work is:

1. Set `API_BASE_URL` to the Bird API host (when available)
2. Configure Google/Apple OAuth for `com.trackzio.birds`
3. Configure `APP_CODE` for notification service
4. Update `birdzyPacks.json` product IDs to match backend validation

Core/specimen endpoints (`/core/*`) are a separate migration — see `docs/DOMAIN_MIGRATION_INVENTORY.md`.

---

## Related files

| File | Role |
|------|------|
| `src/constants/api.ts` | Endpoint path constants |
| `src/services/api/features/auth.api.ts` | HTTP implementation |
| `src/services/api/features/auth.api.types.ts` | Types |
| `src/features/auth/auth.store.ts` | State + persistence |
| `src/features/auth/services/auth.service.ts` | Business logic |
| `src/services/api/axios.ts` | Interceptors + refresh |
| `src/services/auth/socialLogin.service.ts` | Native Google/Apple |
| `src/constants/env.ts` | `API_BASE_URL` resolution |
