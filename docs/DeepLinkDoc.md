# DeepLink

I've prepared a consolidated document covering the complete **Deep Linking implementation and Authentication flow** used in the BanknoteID app. The intention is to make this our standard reference for implementing deep links in future React Native projects.

### **What's Covered**

**1\. Deep Linking Architecture**

* Support for both **Custom Scheme** (`banknoteapp://`) and **HTTPS App Links / Universal Links** (`https://banknote-app-4f3fd.web.app/...`)  
* Android and iOS native configuration (Intent Filters, App Links, Universal Links, `assetlinks.json`, AASA, Associated Domains, etc.)  
* React Native `Linking` integration (`getInitialURL` \+ `url` listener)  
* Centralized route mapping for all supported deep links  
* Manual React Navigation handling instead of automatic URL-to-state mapping for better control  
* Share URL strategy and web fallback for users who don't have the app installed

**2\. Deep Link Authentication Flow**

* Every deep link requires an authenticated session before navigation.  
* If the user is already authenticated (guest or account), navigation continues immediately.  
* If no session exists, the app automatically performs a **guest login**, stores the destination as a pending deep link, and navigates once authentication and the navigator are ready.  
* Onboarding and post-auth flows are skipped for deep-link entries to avoid unnecessary screens.  
* Special handling for subscription (`/subs`) links, including subscription status checks and paywall navigation.

### **Supported Scenarios**

The implementation handles all major user states consistently:

* First-time or logged-out users  
* Existing guest users  
* Logged-in users  
* Cold start (app closed)  
* Warm start (app already running)  
* Subscription campaign links  
* Web-to-app fallback when the app is not installed

### **Key Design Decisions**

* No Branch, AppsFlyer, or Firebase Dynamic Links.  
* Uses **Custom Scheme \+ Verified HTTPS App Links/Universal Links** only.  
* Single JavaScript deep-link handler for both Android and iOS.  
* Centralized route configuration.  
* Pending deep-link queue to prevent race conditions.  
* Authentication is completed before navigation.  
* Navigation is controlled manually to avoid onboarding/authentication screen flashes.

### **Current Limitations**

* iOS Universal Links require the Apple App Site Association (AASA) file to be hosted.  
* Verify that the `.well-known` directory (`assetlinks.json` and AASA) is deployed correctly.  
* Listing shares should be aligned with HTTPS links.  
* Install-deferred deep linking (after Play Store/App Store install) is not currently supported.

### **Overall Flow**

User taps Deep Link  
        ↓  
Android / iOS receives URL  
        ↓  
Native Bridge  
(Intent / RCTLinkingManager)  
        ↓  
React Native Linking  
        ↓  
Parse & Validate Route  
        ↓  
Skip Onboarding / Post-Auth Gates  
        ↓  
Check Authentication  
        ↓  
Guest Login (if required)  
        ↓  
Store Pending Deep Link  
        ↓  
Navigator Ready  
        ↓  
Navigate to Target Screen  
        ↓  
(For /subs: Check Subscription → Home or Paywall)

This implementation provides a consistent and reliable deep-linking experience across Android and iOS while keeping the architecture simple, reusable, and independent of third-party deep-linking SDKs. It should serve as a solid reference for implementing deep links in our future applications as well.

Please review it and share any feedback or suggestions.

# Explanation

I've also documented the **Deep Link Authentication Flow** used in the BanknoteID app. This complements the deep-linking architecture document and explains how we handle authentication, guest sessions, onboarding, and subscription flows when a user opens the app through a deep link.

### **Objective**

The primary goal is to ensure that **every deep link successfully reaches its intended destination**, regardless of whether the user is:

* A first-time user  
* Logged out  
* Using a guest session  
* Logged in with an account  
* Subscribed or not subscribed

The experience should be seamless without forcing unnecessary onboarding or login screens.

### **Core Authentication Principle**

Every deep link requires an authenticated session before navigation.

If the user already has an authenticated session (guest or account), we navigate directly.

If no session exists, we automatically create a **guest session**, keep the deep-link destination pending, and navigate once authentication and navigation are ready.

This means deep links **do not force users to log in first**.

### **High-Level Flow**

User taps Deep Link  
        ↓  
Parse URL  
        ↓  
Skip Onboarding & First-Run Gates  
        ↓  
Check Authentication  
        ↓  
Authenticated?  
   ├── Yes → Navigate  
   └── No  
          ↓  
     Guest Login  
          ↓  
Store Pending Destination  
          ↓  
Navigator Ready  
          ↓  
Navigate to Target Screen

### **User Scenarios Covered**

**1\. Logged Out / First-Time User**

* Automatically creates a guest session.  
* Skips onboarding and post-auth flows.  
* Opens the requested screen directly.  
* Login is not required before viewing the deep-linked content.

**2\. Existing Guest User**

* Reuses the existing guest session.  
* No additional authentication.  
* Navigates directly to the destination.

**3\. Logged-In User**

* Uses the current authenticated account.  
* Opens the requested screen immediately.  
* Subscription status and user data remain unchanged.

**4\. Guest Upgrades to Account**

* Deep linking is unaffected.  
* Guest data can later be promoted to a full account during signup/login.  
* The deep-link flow only ensures that a valid session exists.

### **Special Handling for `/subs`**

The subscription deep link follows a slightly different flow.

* If the user isn't authenticated, a guest session is created automatically.  
* Subscription status is synchronized.  
* If already subscribed → navigate to Home.  
* If not subscribed → open the Subscription Paywall (`comingfrom: "deepLink"`).

This allows marketing or campaign links to work consistently for both new and existing users.

### **Cold Start vs Warm Start**

**Cold Start**

* App launches from a terminated state.  
* Authentication is completed first.  
* Pending deep link is stored.  
* Navigation occurs after the app is fully initialized.

**Warm Start**

* App is already running.  
* The incoming URL is processed immediately.  
* If authenticated, navigation happens directly.  
* If authentication is still in progress, the destination remains pending until ready.

### **Race Condition Protection**

To avoid navigation conflicts during startup, the implementation includes several safeguards:

* Pending deep-link queue until authentication and navigation are ready.  
* Skip onboarding and post-auth flows for deep-link entries.  
* Temporary protection against auth-stack resets while processing deep links.  
* Retry mechanism after authentication completes.  
* Special pending flow for subscription links until subscription status is known.

These protections ensure users don't briefly see Home, Login, or Onboarding before being redirected to their intended destination.

### **What We Intentionally Avoid**

* We do **not** force Login or Signup before opening a deep-linked screen.  
* We do **not** differentiate navigation between guest users and registered users.  
* We do **not** show the post-auth onboarding/subscription funnel for deep-link entries.  
* We do **not** support install-deferred deep linking after a fresh app installation.

### **Summary**

Our deep-link authentication strategy is straightforward:

* Every deep link requires a valid session.  
* If no session exists, create a guest session automatically.  
* Skip onboarding and first-run experiences.  
* Hold the destination until authentication and navigation are ready.  
* Navigate the user directly to the requested screen.  
* Handle subscription links separately by checking subscription status before deciding between Home and the Paywall.

This approach provides a consistent user experience across Android and iOS while keeping the implementation centralized, maintainable, and reusable for future applications.

Please go through the document and share any feedback or suggestions. If everyone agrees, we can use this as the standard deep-link authentication pattern for future projects as well.

# Firebase

# **Deep Linking Setup Guide**

## **Android App Links & iOS Universal Links using Firebase Hosting**

**Author:**  
**Last Updated:**  
**Version:** 1.0

---

# **1\. Introduction**

This document explains how to implement **Deep Linking** for any mobile application using **Firebase Hosting** as the verification domain for both **Android App Links** and **iOS Universal Links**.

The goal is to provide a standard implementation that can be reused across projects with minimal changes. By following this guide, users will be able to tap a web URL and seamlessly open the corresponding screen inside the mobile application. If the application is not installed, they can be redirected to the Play Store or App Store.

This guide focuses only on the deep linking infrastructure and does **not** cover application-specific business logic.

---

# **2\. Types of Deep Links**

There are two commonly used approaches for deep linking.

| Type | Example | Verification Required |
| ----- | ----- | ----- |
| Custom URL Scheme | `banknoteapp://home` | No |
| Android App Links / iOS Universal Links | `https://banknote-app-4f3fd.web.app/home` | Yes |

### **Custom URL Scheme**

A custom URL scheme is the simplest form of deep linking.

Example:

banknoteapp://home

The operating system directly attempts to open the application using the registered scheme.

**Advantages**

* Easy to configure  
* Works without website verification

**Limitations**

* Any application can register the same scheme  
* Less secure  
* Browsers may not always behave consistently

---

### **App Links & Universal Links**

Example:

https://banknote-app-4f3fd.web.app/home

These use a standard HTTPS URL and require the application to prove ownership of the domain.

Both Android and iOS verify this ownership before opening the application.

**Advantages**

* More secure  
* Better user experience  
* Uses standard HTTPS URLs  
* Prevents malicious applications from claiming the same links

---

# **3\. High-Level Architecture**

When a user taps a deep link, the following sequence occurs:

User taps

https://YOUR-DOMAIN/home  
        │  
        ▼  
Firebase Hosting  
        │  
        ├── Android Verification  
        │      /.well-known/assetlinks.json  
        │  
        ├── iOS Verification  
        │      /.well-known/apple-app-site-association  
        │  
        └── open.html  
               │  
       ┌───────┴─────────┐  
       │                 │  
       ▼                 ▼  
Open Mobile App    Redirect to App Store

The website acts only as the verification layer and fallback mechanism.

---

# **4\. Components Involved**

A complete deep linking implementation consists of four major components.

## **Website**

The website is responsible for:

* Hosting the verification files  
* Serving the opener page  
* Configuring rewrites  
* Returning the correct HTTP headers

---

## **Android**

Android requires:

* App Links intent filters  
* SHA-256 signing certificates  
* Package name  
* Domain verification

---

## **iOS**

iOS requires:

* Apple App Site Association (AASA)  
* Associated Domains capability  
* Team ID  
* Bundle Identifier

---

## **React Native**

The application itself only needs:

* Linking configuration  
* Navigation mapping  
* Route handling

No additional business logic is required.

---

# **5\. Configuration Values**

Before implementation, collect the following information.

| Configuration | Example |
| ----- | ----- |
| Firebase Hosting Domain | banknote-app-4f3fd.web.app |
| Android Package Name | com.trackzio.banknote |
| iOS Bundle Identifier | com.trackzio.banknote |
| Apple Team ID | FUQBY8BYY3 |
| Custom URL Scheme | banknoteapp |
| Supported Routes | /home, /feed |
| Play Store URL | Play Store Listing |
| App Store URL | App Store Listing |

These values will be reused throughout the implementation.

---

# **6\. Android App Links**

Android verifies domain ownership using the **Digital Asset Links** file.

The file must be hosted at:

https://YOUR-DOMAIN/.well-known/assetlinks.json

Example:

\[  
  {  
    "relation": \[  
      "delegate\_permission/common.handle\_all\_urls",  
      "delegate\_permission/common.get\_login\_creds"  
    \],  
    "target": {  
      "namespace": "android\_app",  
      "package\_name": "YOUR.PACKAGE.NAME",  
      "sha256\_cert\_fingerprints": \[  
        "AA:BB:CC:DD:..."  
      \]  
    }  
  }  
\]  
---

## **SHA-256 Certificates**

One of the most common causes of App Link failures is an incorrect SHA-256 certificate.

Include every certificate that users may install.

* Play App Signing certificate (**Required**)  
* Release certificate  
* Upload certificate (if different)  
* Debug certificate (for local testing)

Retrieve the SHA-256 fingerprint using:

keytool \-list \-v \\  
\-keystore your-release.keystore \\  
\-alias your-alias

The fingerprint must:

* Be uppercase  
* Use colon-separated hexadecimal values  
* Match the signing certificate used by the installed application

---

## **Hosting Requirements**

The `assetlinks.json` file must:

* Be accessible over HTTPS  
* Return HTTP 200  
* Not redirect  
* Be served with

Content-Type: application/json

Verify the file by opening:

https://YOUR-DOMAIN/.well-known/assetlinks.json

Google also provides a verification API.

https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://YOUR-DOMAIN\&relation=delegate\_permission/common.handle\_all\_urls

Keep in mind that Google's verification service may cache previous results for several hours.

---

# **7\. Android Manifest Configuration**

Two intent filters are typically configured.

## **Custom Scheme**

\<intent-filter\>

    \<action android:name="android.intent.action.VIEW"/\>

    \<category android:name="android.intent.category.DEFAULT"/\>

    \<category android:name="android.intent.category.BROWSABLE"/\>

    \<data android:scheme="YOURSCHEME"/\>

\</intent-filter\>  
---

## **Android App Links**

\<intent-filter android:autoVerify="true"\>

    \<action android:name="android.intent.action.VIEW"/\>

    \<category android:name="android.intent.category.DEFAULT"/\>

    \<category android:name="android.intent.category.BROWSABLE"/\>

    \<data  
        android:scheme="https"  
        android:host="YOUR-DOMAIN"/\>

\</intent-filter\>

Ensure that:

* Package name matches `assetlinks.json`  
* Domain matches Firebase Hosting  
* SHA certificate matches the installed application

---

## **Verification**

After installation, Android can re-verify App Links.

adb shell pm clear com.android.statementservice

adb shell pm verify-app-links \--re-verify YOUR.PACKAGE.NAME

adb shell pm get-app-links YOUR.PACKAGE.NAME

A successful configuration should show the hosting domain as **verified**.

---

# **8\. iOS Universal Links**

iOS verifies ownership using the **Apple App Site Association (AASA)** file.

Location:

https://YOUR-DOMAIN/.well-known/apple-app-site-association

Do **not** use a `.json` extension.

Example:

{  
  "applinks": {  
    "apps": \[\],  
    "details": \[  
      {  
        "appID": "TEAMID.BUNDLE.ID",  
        "paths": \[  
          "/home",  
          "/home/\*",  
          "/feed",  
          "/feed/\*"  
        \]  
      }  
    \]  
  }  
}

Example App ID:

FUQBY8BYY3.com.trackzio.banknote  
---

## **Xcode Configuration**

In Xcode:

**Signing & Capabilities**

↓

**Associated Domains**

↓

Add:

applinks:YOUR-DOMAIN  
---

## **Hosting Requirements**

The AASA file must:

* Use HTTPS  
* Return HTTP 200  
* Have no redirects  
* Be served as

application/json

or

application/pkcs7-mime  
---

# **9\. Firebase Hosting Configuration**

Firebase Hosting serves both the verification files and the fallback page.

Each supported route should rewrite to an opener page.

Example:

{  
    "source": "/home",  
    "destination": "/open.html"  
}

The opener page should:

1. Attempt to launch the application.  
2. Wait briefly.  
3. Redirect to the Play Store or App Store if the application is not installed.

---

## **Verification Files**

Both verification files should be placed inside:

public/  
└── .well-known/  
    ├── assetlinks.json  
    └── apple-app-site-association

Avoid ignoring hidden directories in `firebase.json`.

Incorrect:

"ignore": \[  
    "\*\*/.\*"  
\]

Otherwise, Firebase will not deploy the `.well-known` folder.

---

# **10\. React Native Configuration**

React Navigation should map incoming URLs to application screens.

Example:

| URL | Screen |
| ----- | ----- |
| `https://DOMAIN/home` | Home |
| `banknoteapp://home` | Home |
| `https://DOMAIN/feed` | Feed |

Typical prefixes include:

banknoteapp://

https://YOUR-DOMAIN  
---

# **11\. Suggested Project Structure**

public/  
│  
├── .well-known/  
│   ├── assetlinks.json  
│   └── apple-app-site-association  
│  
├── open.html  
│  
└── js/  
    └── deep-link.js

config/  
└── deep-links.json

firebase.json

android/  
└── AndroidManifest.xml

ios/  
└── Associated Domains  
---

# **12\. Common Issues**

| Problem | Likely Cause |
| ----- | ----- |
| `ERROR_CODE_MALFORMED_CONTENT` | Incorrect SHA-256 format |
| Verification API not updated | Google cache delay |
| App does not open after Play Store install | Missing Play App Signing SHA |
| Universal Links not working | Incorrect Team ID, Bundle ID, or AASA configuration |
| `.well-known` returns 404 | Verification files not deployed |
| HTML returned instead of JSON | SPA rewrite intercepting requests |

---

# **13\. Recommended Implementation Order**

To avoid configuration issues, implement deep linking in the following order:

1. Create the Firebase Hosting site or custom domain.  
2. Add the Android and iOS verification files to the `.well-known` directory.  
3. Deploy Firebase Hosting.  
4. Configure Android App Links.  
5. Configure iOS Universal Links.  
6. Configure React Native linking.  
7. Add all required SHA-256 certificates.  
8. Verify App Links using ADB.  
9. Test Universal Links on a physical iOS device.  
10. Validate fallback behaviour when the application is not installed.

---

# **14\. Implementation Checklist**

## **Firebase Hosting**

*  Hosting domain created  
*  `assetlinks.json` added  
*  `apple-app-site-association` added  
*  `open.html` implemented  
*  Rewrites configured  
*  Response headers configured  
*  Hosting deployed

### **Android**

*  Custom URL Scheme configured  
*  Android App Links configured  
*  Play App Signing SHA added  
*  Release SHA added  
*  Verification successful

### **iOS**

*  AASA file created  
*  Associated Domains enabled  
*  Team ID verified  
*  Bundle Identifier verified  
*  Physical device testing completed

### **React Native**

*  Linking prefixes configured  
*  Routes mapped  
*  Navigation tested

---

# **15\. Conclusion**

Implementing deep linking primarily involves configuring the hosting environment and platform-specific settings rather than modifying application logic.

The website is responsible for proving ownership of the domain through the Android Digital Asset Links file and the Apple App Site Association file. Android and iOS then verify these files before allowing HTTPS links to open the application. Within the mobile app, only the linking configuration and navigation mapping are required to route users to the correct screen.

Once all components are configured correctly, users can open the application directly from HTTPS links, while those without the app installed are seamlessly redirected to the appropriate app store. This approach provides a secure, reliable, and consistent deep linking experience across both Android and iOS platforms.

