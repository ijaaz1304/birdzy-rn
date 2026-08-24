#!/usr/bin/env python3
"""Generate docs/FIREBASE_SETUP_AND_TESTING.docx from project Firebase configuration."""

from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
import os

OUTPUT = os.path.join(
    os.path.dirname(__file__), "..", "docs", "FIREBASE_SETUP_AND_TESTING.docx"
)


def set_cell_shading(cell, color_hex: str):
    shading = OxmlElement("w:shd")
    shading.set(qn("w:fill"), color_hex)
    cell._tc.get_or_add_tcPr().append(shading)


def add_table(doc, headers, rows, header_color="1F4E79"):
    table = doc.add_table(rows=1 + len(rows), cols=len(headers))
    table.style = "Table Grid"
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    hdr = table.rows[0].cells
    for i, h in enumerate(headers):
        hdr[i].text = h
        set_cell_shading(hdr[i], header_color)
        for p in hdr[i].paragraphs:
            for run in p.runs:
                run.bold = True
                run.font.color.rgb = RGBColor(255, 255, 255)
    for ri, row in enumerate(rows):
        for ci, val in enumerate(row):
            table.rows[ri + 1].cells[ci].text = str(val)
    doc.add_paragraph()
    return table


def add_bullets(doc, items):
    for item in items:
        doc.add_paragraph(item, style="List Bullet")


def add_numbered(doc, items):
    for item in items:
        doc.add_paragraph(item, style="List Number")


def add_test_block(doc, title, preconditions, steps, expected, console_notes=None):
    doc.add_heading(title, level=3)
    p = doc.add_paragraph()
    p.add_run("Preconditions: ").bold = True
    p.add_run(preconditions)
    p = doc.add_paragraph()
    p.add_run("Steps:").bold = True
    add_numbered(doc, steps)
    p = doc.add_paragraph()
    p.add_run("Expected result: ").bold = True
    p.add_run(expected)
    if console_notes:
        p = doc.add_paragraph()
        p.add_run("Console / tooling: ").bold = True
        p.add_run(console_notes)
    doc.add_paragraph()


def build():
    doc = Document()

    # Title
    title = doc.add_heading("Shroom AI — Firebase Setup & Testing Guide", 0)
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    sub = doc.add_paragraph(
        "Complete reference for Firebase configuration, deploy files, analytics events, "
        "and QA testing methods for every Firebase service used in this app."
    )
    sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    doc.add_paragraph("Document version: 1.0  |  Project: Shroom-Ai (React Native)")
    doc.add_paragraph()

    # --- 1. Overview ---
    doc.add_heading("1. Overview", level=1)
    doc.add_paragraph(
        "Shroom AI uses React Native Firebase (@react-native-firebase v23.8.x) with two "
        "Firebase projects (dev and prod). Native SDKs auto-initialize from google-services.json "
        "(Android) and GoogleService-Info.plist (iOS). JavaScript services are initialized in "
        "App.tsx via initializeFirebase(), then Remote Config, Analytics, and Performance start "
        "in the background."
    )
    add_table(
        doc,
        ["Environment", "Firebase Project ID", "Android Package", "iOS Bundle ID"],
        [
            ["Dev", "mushrooms-app-dev", "com.trackzio.mushrooms.dev", "com.trackzio.mushrooms.dev"],
            ["Prod", "mushrooms-app-dfdc5", "com.trackzio.mushrooms", "com.trackzio.mushrooms"],
        ],
    )

    doc.add_heading("1.1 Firebase CLI aliases (.firebaserc)", level=2)
    doc.add_paragraph('default / dev → mushrooms-app-dev')
    doc.add_paragraph('prod → mushrooms-app-dfdc5')

    doc.add_heading("1.2 NPM scripts (package.json)", level=2)
    add_table(
        doc,
        ["Script", "Purpose"],
        [
            ["npm run env:dev / env:prod", "Switch .env before build or Metro"],
            ["npm run start:dev / start:prod", "Metro with correct env"],
            ["npm run android:build:dev:apk", "Dev release APK (debug signing)"],
            ["npm run android:build:prod:apk", "Prod release APK (upload keystore)"],
            ["npm run remoteconfig:push:dev", "Deploy remoteconfig.template.json to dev"],
            ["npm run remoteconfig:push:prod", "Deploy Remote Config to prod"],
            ["npm run firebase:deploy:dev:rules", "Deploy Firestore + Storage rules to dev"],
            ["npm run firebase:deploy:prod:rules", "Deploy rules to prod"],
            ["npm run firebase:deploy:dev:indexes", "Deploy firestore.indexes.json to dev"],
            ["npm run firebase:deploy:prod:indexes", "Deploy indexes to prod"],
            ["npm run firebase:deploy:dev", "Full deploy (hosting, rules, indexes, RC) dev"],
            ["npm run firebase:deploy:prod", "Full deploy prod"],
        ],
    )

    # --- 2. Services ---
    doc.add_heading("2. Firebase Services in Use", level=1)
    add_table(
        doc,
        ["Service", "NPM Package", "Purpose", "Key source files"],
        [
            ["App (core)", "@react-native-firebase/app", "SDK bootstrap", "src/lib/firebase/config.ts"],
            ["Analytics", "@react-native-firebase/analytics", "Events, GA4, user props", "src/services/analytics/"],
            ["Crashlytics", "@react-native-firebase/crashlytics", "Crash reports (prod only)", "src/lib/firebase/config.ts"],
            ["Firestore", "@react-native-firebase/firestore", "Community feed", "src/services/firebase/feed.service.ts"],
            ["Storage", "@react-native-firebase/storage", "Feed post images", "src/services/firebase/storage.service.ts"],
            ["Remote Config", "@react-native-firebase/remote-config", "Feature flags & limits", "src/services/remoteConfig/"],
            ["Performance", "@react-native-firebase/perf", "Traces & metrics", "src/services/performance/performance.service.ts"],
            ["Messaging (FCM)", "@react-native-firebase/messaging", "Push notifications", "src/services/notifications/pushNotification.service.ts"],
        ],
    )

    doc.add_heading("2.1 Environment-specific behavior", level=2)
    add_bullets(
        doc,
        [
            "Analytics: collection enabled in both dev and prod builds.",
            "Crashlytics: disabled when __DEV__ is true; enabled in release/prod.",
            "Panic guard: dev bundle (.dev package) + prod Firebase project → app crashes at startup (intentional).",
            "Remote Config: 1-hour local cache; defaults in remoteConfig.service.ts if network unavailable.",
        ],
    )

    # --- 3. Native config ---
    doc.add_heading("3. Native App Configuration (Download from Firebase Console)", level=1)
    doc.add_paragraph(
        "These files are NOT uploaded to Firebase. Download from Firebase Console → Project settings → "
        "Your apps, then place in the repo."
    )

    doc.add_heading("3.1 Android — google-services.json", level=2)
    add_table(
        doc,
        ["Flavor", "File path", "Package name"],
        [
            ["dev", "android/app/src/dev/google-services.json", "com.trackzio.mushrooms.dev"],
            ["prod", "android/app/src/prod/google-services.json", "com.trackzio.mushrooms"],
        ],
    )
    doc.add_paragraph(
        "Gradle plugins in android/app/build.gradle: com.google.gms.google-services, "
        "com.google.firebase.crashlytics. Product flavors pick the matching JSON via src/<flavor>/."
    )

    doc.add_heading("3.2 iOS — GoogleService-Info.plist", level=2)
    add_table(
        doc,
        ["Build config", "Source file", "Runtime name"],
        [
            ["Debug-Dev / Release-Dev", "ios/ShroomAI/GoogleService-Info-Dev.plist", "GoogleService-Info.plist"],
            ["Prod", "ios/ShroomAI/GoogleService-Info.plist", "GoogleService-Info.plist"],
        ],
    )
    doc.add_paragraph(
        "Xcode build phase copies the correct plist into the app bundle based on CONFIGURATION."
    )

    # --- 4. Deploy files ---
    doc.add_heading("4. Files Deployed TO Firebase (CLI)", level=1)

    doc.add_heading("4.1 remoteconfig.template.json", level=2)
    doc.add_paragraph("Main config JSON. Push with: npm run remoteconfig:push:dev or :prod")
    add_table(
        doc,
        ["Parameter (sample)", "Type", "Purpose"],
        [
            ["freeUserDailyScanLimit", "NUMBER", "Daily scan cap for free users (default 2)"],
            ["freeUserDailyFeedPostLimit", "NUMBER", "Daily feed posts for free users (default 1)"],
            ["subscription50OfferEndTs", "NUMBER", "Unix ms; 0 = 50% offer inactive"],
            ["quizEnabled", "NUMBER", "Quiz feature toggle (1 = on)"],
            ["darkModeEnabled", "BOOLEAN", "Dark mode flag"],
            ["androidPlayStoreUrl / iosAppStoreUrl", "STRING", "Store links for share/rate"],
            ["apiTimeoutMs", "NUMBER", "API timeout (default 30000)"],
            ["feedPageSize", "NUMBER", "Feed pagination size"],
        ],
    )
    doc.add_paragraph("Full parameter list: see remoteconfig.template.json and src/services/remoteConfig/remoteConfig.service.ts")

    doc.add_heading("4.2 firestore.indexes.json", level=2)
    doc.add_paragraph("Composite indexes for posts, comments, replies, notifications. Deploy: npm run firebase:deploy:*:indexes")

    doc.add_heading("4.3 firestore.rules & storage.rules", level=2)
    add_bullets(
        doc,
        [
            "firestore.rules — posts, comments, replies, notifications, reports, user feed prefs.",
            "storage.rules — public read/write under /posts/{postId}/** only.",
            "Deploy: npm run firebase:deploy:dev:rules or firebase:deploy:prod:rules",
        ],
    )

    doc.add_heading("4.4 firebase.json & Hosting", level=2)
    add_bullets(
        doc,
        [
            "hosting/public/.well-known/apple-app-site-association — iOS universal links",
            "hosting/public/.well-known/assetlinks.json — Android App Links",
            "hosting/public/index.html — fallback for hosting rewrites",
        ],
    )

    # --- 5. Analytics ---
    doc.add_heading("5. Analytics Events (Code — No JSON Upload)", level=1)
    doc.add_paragraph(
        "250+ events defined in src/services/analytics/analytics.events.ts. "
        "All logging goes through analyticsService in analytics.service.ts. "
        "String params are truncated to 100 chars in config.ts."
    )

    doc.add_heading("5.1 Event categories", level=2)
    categories = [
        ("App lifecycle", "app_open, first_open, session_end, app_session_start, session_length"),
        ("Auth", "login, signup_success, guest_signup_success, unified_auth_success, logout"),
        ("Screens", "screen_view, homescreen, feed_screen, subscription_screen, settings_screen"),
        ("Identification", "identify_click, identify_photo, identification_done_success, identification_done_failure"),
        ("Subscription", "subs_confirm, paid_purchase, trial_started, Trial_converted, subs_fail"),
        ("Feed", "post_created, post_liked, feed_comment, feed_view, posts_fetch_error"),
        ("Quiz", "quiz_started, quiz_completed, quiz_result_shared, which_mushroom_screen_1"),
        ("Attribution (Android)", "install_attribution, install_referrer_received, meta_referrer_received, install_campaign_attributed"),
        ("Notifications", "notification_received, notification_opened, notification_permission_granted"),
        ("Rate us", "rate_us_popup, rate_us_rate_now, feedback_submitted"),
    ]
    add_table(doc, ["Category", "Example events"], categories)

    doc.add_heading("5.2 Auto-attached params", level=2)
    doc.add_paragraph("Many events include: date, time, user_id, country, platform (from analytics.service.ts).")

    doc.add_heading("5.3 Adding a new event", level=2)
    add_numbered(
        doc,
        [
            "Add constant to EVENTS in analytics.events.ts",
            "Call analyticsService.logEvent(EVENTS.your_event, { key: 'value' })",
            "Keep string values ≤ 100 characters",
            "Ship app update — no Firebase CLI deploy needed",
            "Optional: mark as conversion in GA4 console",
        ],
    )

    # --- 6. Code map ---
    doc.add_heading("6. Code Map", level=1)
    code_map = """src/lib/firebase/config.ts       — Init, Analytics, RC, Firestore, Crashlytics, Perf
src/services/analytics/          — Event catalog + analyticsService
src/services/remoteConfig/       — Remote Config fetch, cache, getters
src/services/firebase/           — Firestore feed + Storage uploads
src/services/attribution/        — Install referrer → Firebase events
src/services/notifications/      — FCM + Notifee
src/services/performance/        — Firebase Performance traces

Root: firebase.json, .firebaserc, remoteconfig.template.json,
      firestore.rules, firestore.indexes.json, storage.rules"""
    doc.add_paragraph(code_map)

    # --- 7. TESTING ---
    doc.add_page_break()
    doc.add_heading("7. Testing Methods — Complete QA Guide", level=1)
    doc.add_paragraph(
        "This section lists how to verify each Firebase integration. "
        "Use dev project (mushrooms-app-dev) for day-to-day QA unless explicitly testing prod."
    )

    doc.add_heading("7.1 Prerequisites for all testing", level=2)
    add_bullets(
        doc,
        [
            "Firebase CLI logged in: npx firebase-tools@latest login",
            "Correct env: npm run env:dev (or env:prod) before builds",
            "Physical device or emulator with Google Play services (Android Analytics/FCM)",
            "In-app App Logs: Settings → App Logs (export/share JSON for QA reports)",
            "Metro logcat (Android): adb logcat -s ReactNativeJS",
        ],
    )

    # 7.2 Firebase App / Project verification
    doc.add_heading("7.2 Firebase App & Project Verification", level=2)
    add_test_block(
        doc,
        "TEST-FB-001: Correct Firebase project loaded",
        "Build dev APK or run dev debug. APP_ENV=dev.",
        [
            "Launch app and watch Metro or adb logcat.",
            "Look for: 'Firebase project verified: mushrooms-app-dev (DEV intent)'.",
            "Confirm no PANIC GUARD error on startup.",
        ],
        "Console shows dev project ID. App does not crash.",
        "src/lib/firebase/config.ts → verifyFirebaseProject()",
    )
    add_test_block(
        doc,
        "TEST-FB-002: Panic guard (dev app must not use prod Firebase)",
        "Intentionally wrong google-services.json in dev flavor pointing to prod (staging test only).",
        [
            "Install dev build with prod google-services.json.",
            "Launch app.",
        ],
        "App throws PANIC GUARD error and refuses to run. Prevents prod data pollution.",
        "Only triggers when bundle id contains .dev AND Firebase project is mushrooms-app-dfdc5.",
    )
    add_test_block(
        doc,
        "TEST-FB-003: iOS plist copied correctly",
        "Build ShroomAI-Dev scheme (Debug-Dev).",
        [
            "Run ios:dev or Xcode build with Debug-Dev.",
            "Check AppDelegate log: 'GoogleService-Info.plist found at: ...'.",
            "Verify PROJECT_ID in loaded plist matches mushrooms-app-dev for dev builds.",
        ],
        "Correct plist in bundle; Firebase init succeeds.",
        "ios/ShroomAI.xcodeproj build phase copies GoogleService-Info-Dev.plist for dev.",
    )

    # 7.3 Analytics
    doc.add_heading("7.3 Firebase Analytics", level=2)
    add_test_block(
        doc,
        "TEST-AN-001: Real-time events (DebugView)",
        "Dev build on physical device. Firebase Console access to mushrooms-app-dev.",
        [
            "On Android: adb shell setprop debug.firebase.analytics.app com.trackzio.mushrooms.dev",
            "On iOS: Xcode scheme → Run → Arguments → -FIRAnalyticsDebugEnabled",
            "Open Firebase Console → Analytics → DebugView.",
            "Launch app — trigger app_open / first_open.",
            "Navigate Home → Feed → Camera — verify screen_view events.",
        ],
        "Events appear in DebugView within seconds with params (user_id, platform, country).",
        "Disable debug mode after testing: adb shell setprop debug.firebase.analytics.app .none.",
    )
    add_test_block(
        doc,
        "TEST-AN-002: Identification flow events",
        "Logged-in or guest user with scan quota remaining.",
        [
            "Tap Identify tab → identify_bottom_nav event.",
            "Take photo → identify_photo, photo_clicked, identify_image_captured.",
            "Complete scan → identification_done_success or identification_done_failure.",
        ],
        "Full funnel visible in DebugView. Params include source (camera/gallery).",
        "EVENTS in analytics.events.ts; CameraScreen.tsx, DiagnosisLoadingScreen.tsx",
    )
    add_test_block(
        doc,
        "TEST-AN-003: Subscription / purchase events",
        "Sandbox/test IAP account. Dev or prod as appropriate.",
        [
            "Open subscription screen → subs_screen_viewed, subscription_page_view.",
            "Initiate purchase → subs_payment_initiated, subs_native.",
            "Complete or cancel → subs_confirm or subs_cancel.",
        ],
        "Purchase events include plan_type/product_id params. paid_purchase for non-trial.",
        "useIapPurchase.ts logs subs_* events.",
    )
    add_test_block(
        doc,
        "TEST-AN-004: Feed events",
        "User logged in. Firestore rules deployed.",
        [
            "Open Feed tab → feed_view, feed_screen.",
            "Create post with image → post_created, feed_post, image_uploaded.",
            "Like a post → post_liked / feed_like.",
            "Add comment → feed_comment.",
        ],
        "Events fire with post_id params. image_uploaded includes path and file_name.",
        "feed.service.ts, storage.service.ts",
    )
    add_test_block(
        doc,
        "TEST-AN-005: App Logs mirror for analytics errors",
        "App Logs enabled in Settings.",
        [
            "Use app normally.",
            "If logEvent fails, check Settings → App Logs for 'Error logging event'.",
            "Export logs via share button on App Logs screen.",
        ],
        "Analytics failures captured in App Logs without crashing app.",
        "src/features/settings/screens/AppLogsScreen.tsx",
    )
    add_test_block(
        doc,
        "TEST-AN-006: Historical reports (GA4)",
        "Wait 24–48h after DebugView testing.",
        [
            "Firebase Console → Analytics → Events.",
            "Compare event counts for app_open, screen_view, identify_click.",
            "GA4 → Explore → create funnel (optional).",
        ],
        "Aggregated counts match expected usage. DebugView is real-time; reports are delayed.",
        None,
    )

    # 7.4 Crashlytics
    doc.add_heading("7.4 Firebase Crashlytics", level=2)
    add_test_block(
        doc,
        "TEST-CR-001: Crashlytics disabled in dev debug",
        "__DEV__ true (npm run android / Metro debug).",
        [
            "Launch debug build.",
            "Check logs: 'Firebase Crashlytics disabled (DEV mode)'.",
            "Trigger analyticsService.logError() or non-fatal via feature error.",
        ],
        "No crashes appear in Crashlytics dashboard for debug sessions.",
        "config.ts setCrashlyticsCollectionEnabled(false) in __DEV__.",
    )
    add_test_block(
        doc,
        "TEST-CR-002: Crashlytics enabled in release",
        "Prod or dev release APK (assembleDevRelease / assembleProdRelease).",
        [
            "Install release APK (not debug).",
            "Check logcat for 'Firebase Crashlytics enabled (PROD mode)' or release init.",
            "Force test crash (internal QA build only): firebaseCrashlytics.crash() if exposed, or trigger native crash.",
            "Wait 5–15 minutes. Firebase Console → Crashlytics.",
        ],
        "Crash appears in Crashlytics with device/OS/stack trace.",
        "Use dev release APK first to avoid polluting prod dashboard.",
    )
    add_test_block(
        doc,
        "TEST-CR-003: Non-fatal errors via logError",
        "Release build recommended.",
        [
            "Trigger API failure or use analyticsService.logError(new Error('QA test')).",
            "Open Crashlytics → Non-fatals.",
        ],
        "Error recorded with error_name and linked to error_occurred analytics event.",
        "analytics.service.ts logError() calls recordError + logEvent.",
    )

    # 7.5 Firestore
    doc.add_heading("7.5 Cloud Firestore (Community Feed)", level=2)
    add_test_block(
        doc,
        "TEST-FS-001: Create and read post",
        "Firestore rules deployed to dev. User logged in.",
        [
            "Open Feed → tap create post.",
            "Add text + optional image → submit.",
            "Pull to refresh — post appears in list.",
            "Firebase Console → Firestore → posts collection → verify document.",
        ],
        "Document has userId, userName, content, createdAt, likes[], comments count.",
        "feed.service.ts createPost(). Analytics: post_created_success.",
    )
    add_test_block(
        doc,
        "TEST-FS-002: Comments and replies",
        "Existing post in feed.",
        [
            "Open post → add comment.",
            "Verify posts/{postId}/comments subcollection in Console.",
            "Add reply if supported → posts/.../comments/.../replies.",
        ],
        "Comment documents created with valid shape per firestore.rules.",
        "feed.service.ts comment methods.",
    )
    add_test_block(
        doc,
        "TEST-FS-003: Composite index errors",
        "New query not yet indexed (if rules/indexes out of date).",
        [
            "Run feed query that needs composite index.",
            "If error, Console link in error message points to create index.",
            "Add index to firestore.indexes.json → npm run firebase:deploy:dev:indexes.",
        ],
        "Query succeeds after index build completes (may take minutes).",
        "firestore.indexes.json defines posts, comments, notifications indexes.",
    )
    add_test_block(
        doc,
        "TEST-FS-004: Like / unlike post",
        "Two test accounts optional.",
        [
            "Like post → likes array updated in Firestore.",
            "Unlike → user id removed from likes.",
            "Verify post_liked / post_unliked analytics.",
        ],
        "Firestore update allowed by rules; UI reflects state.",
        None,
    )
    add_test_block(
        doc,
        "TEST-FS-005: Notifications subcollection",
        "User A receives like/comment from User B.",
        [
            "Trigger social action that writes notification doc.",
            "Check users/{userId}/notifications in Console.",
            "Open in-app Notification Center.",
        ],
        "Notification docs queryable by userId + timestamp index.",
        "feed.service.ts NOTIFICATIONS_SUBCOLLECTION.",
    )

    # 7.6 Storage
    doc.add_heading("7.6 Firebase Storage", level=2)
    add_test_block(
        doc,
        "TEST-ST-001: Upload feed image",
        "Storage rules deployed. Create post with photo.",
        [
            "Create feed post with image.",
            "Watch upload progress in UI if shown.",
            "Firebase Console → Storage → posts/{postId}/...",
            "Verify download URL loads in app.",
        ],
        "File uploaded; image_uploaded analytics with path and file_size.",
        "storage.service.ts uploadImage(); perf trace storage_upload_image.",
    )
    add_test_block(
        doc,
        "TEST-ST-002: Delete image",
        "Post with image exists; delete post flow.",
        [
            "Delete post containing image.",
            "Verify image_deleted analytics.",
            "Confirm object removed or orphaned per app logic.",
        ],
        "deleteImage() completes without permission error.",
        "storage.rules allows write under /posts/{postId}/**.",
    )
    add_test_block(
        doc,
        "TEST-ST-003: Storage rules denial",
        "Attempt upload outside /posts/ path (dev test harness if available).",
        [
            "Try ref('other/path') upload from debug code.",
        ],
        "Permission denied — default deny rule blocks non-posts paths.",
        None,
    )

    # 7.7 Remote Config
    doc.add_heading("7.7 Firebase Remote Config", level=2)
    add_test_block(
        doc,
        "TEST-RC-001: Defaults on first launch (offline)",
        "Fresh install or clear app data. Airplane mode ON.",
        [
            "Launch app offline.",
            "Verify scan limit = 2 (freeUserDailyScanLimit default).",
            "Verify feed post limit = 1 for free users.",
        ],
        "App uses DEFAULT_CONFIG from remoteConfig.service.ts without blocking.",
        "Log tag [REMOTE_CONFIG] in Metro when __DEV__.",
    )
    add_test_block(
        doc,
        "TEST-RC-002: Fetch from Firebase",
        "Network on. remoteconfig.template.json deployed to dev.",
        [
            "Change freeUserDailyScanLimit to 5 in Console OR template + npm run remoteconfig:push:dev.",
            "Kill app, relaunch (or background/foreground to trigger refreshRemoteConfig).",
            "Attempt scans — limit should reflect new value after fetch + activate.",
        ],
        "Cached value updates within fetch interval (1hr cache unless forced).",
        "App.tsx refreshes RC on foreground. initializeRemoteConfig on startup.",
    )
    add_test_block(
        doc,
        "TEST-RC-003: Quiz feature flag",
        "Remote Config access.",
        [
            "Set quizEnabled = 0 in Firebase Console Remote Config.",
            "Publish changes. Restart app after fetch.",
            "Verify quiz entry hidden or disabled in UI.",
            "Set quizEnabled = 1 → quiz visible again.",
        ],
        "UI respects quizEnabled from getRemoteConfigValue('quizEnabled').",
        None,
    )
    add_test_block(
        doc,
        "TEST-RC-004: Store URLs",
        "Remote Config deployed.",
        [
            "Set androidPlayStoreUrl / iosAppStoreUrl to test URLs in dev RC.",
            "Trigger share or rate-us flow.",
            "Verify opened URL matches RC value.",
        ],
        "Store links driven by Remote Config, not hardcoded only.",
        "remoteconfig.template.json parameters.",
    )
    add_test_block(
        doc,
        "TEST-RC-005: Deploy template from repo",
        "Firebase CLI logged in.",
        [
            "Edit remoteconfig.template.json locally (e.g. subscriptionDelayMs).",
            "Run npm run remoteconfig:push:dev.",
            "Firebase Console → Remote Config → verify parameter updated.",
        ],
        "CLI deploy succeeds. Template version increments in Console.",
        "Requires firebase login and .firebaserc alias dev.",
    )

    # 7.8 Performance
    doc.add_heading("7.8 Firebase Performance Monitoring", level=2)
    add_test_block(
        doc,
        "TEST-PF-001: App launch trace",
        "Release build recommended (perf more reliable).",
        [
            "Cold start app.",
            "Check Metro/log: 'App launch duration: Xms' in __DEV__.",
            "Firebase Console → Performance → app_launch trace.",
        ],
        "Launch trace recorded with launch_duration_ms metric.",
        "performance.service.ts completeAppLaunchTrace().",
    )
    add_test_block(
        doc,
        "TEST-PF-002: Storage upload trace",
        "Upload feed image.",
        [
            "Create post with image.",
            "Console → Performance → custom trace storage_upload_image.",
        ],
        "Trace shows file_name and path attributes.",
        "storage.service.ts starts trace around putFile.",
    )
    add_test_block(
        doc,
        "TEST-PF-003: Screen / API traces",
        "Use app normally for 24h.",
        [
            "Navigate multiple screens.",
            "Trigger API calls (catalogue, collection).",
            "Review Performance dashboard for screen and network traces.",
        ],
        "Traces appear aggregated. Custom traces from performanceService.",
        None,
    )

    # 7.9 FCM
    doc.add_heading("7.9 Firebase Cloud Messaging (Push)", level=2)
    add_test_block(
        doc,
        "TEST-FCM-001: FCM token registration",
        "Notification permission granted. Physical device.",
        [
            "Launch app → accept notification permission if prompted.",
            "Backend or Firebase Console → Cloud Messaging → send test message to device token.",
            "Verify token retrieved by app (backend logs or App Logs if logged).",
        ],
        "Device receives FCM token; server can target device.",
        "pushNotification.service.ts, @notifee/react-native for display.",
    )
    add_test_block(
        doc,
        "TEST-FCM-002: Foreground notification",
        "App open in foreground.",
        [
            "Send FCM with notification + data payload (type: like, postId: ...).",
            "Verify banner shown via Notifee.",
            "Check notification_received analytics.",
        ],
        "Banner displays; in-app Notification Center updated.",
        "Payload: notification {title, body}, data {type, postId, ...}.",
    )
    add_test_block(
        doc,
        "TEST-FCM-003: Background / killed tap",
        "App in background or force-stopped.",
        [
            "Send push notification.",
            "Tap notification.",
            "Verify notification_opened with source background or killed_state.",
            "App navigates to post/profile per actionUrl.",
        ],
        "Deep navigation works. setupInitialNotificationHandler + setNotificationPressHandler.",
        None,
    )
    add_test_block(
        doc,
        "TEST-FCM-004: Send via Firebase Console",
        "FCM token from test device.",
        [
            "Console → Engage → Messaging → New campaign → Firebase Notification messages.",
            "Target single device with FCM token.",
            "Send test message.",
        ],
        "Notification delivered. Use dev project for QA.",
        None,
    )

    # 7.10 Hosting / deep links
    doc.add_heading("7.10 Firebase Hosting (Deep Links)", level=2)
    add_test_block(
        doc,
        "TEST-HO-001: assetlinks.json (Android)",
        "Hosting deployed to prod/dev hosting site.",
        [
            "curl https://<hosting-domain>/.well-known/assetlinks.json",
            "Verify Content-Type: application/json.",
            "Verify package name and SHA256 fingerprints match release cert.",
        ],
        "JSON valid; App Links verification passes in Play Console.",
        "hosting/public/.well-known/assetlinks.json",
    )
    add_test_block(
        doc,
        "TEST-HO-002: apple-app-site-association (iOS)",
        "Hosting deployed.",
        [
            "curl https://<hosting-domain>/.well-known/apple-app-site-association",
            "No file extension; Content-Type application/json.",
            "Apple CDN validator or device universal link test.",
        ],
        "Universal links open app when installed.",
        "hosting/public/.well-known/apple-app-site-association",
    )
    add_test_block(
        doc,
        "TEST-HO-003: Deploy hosting",
        "Firebase CLI logged in.",
        [
            "npm run firebase:deploy:dev (or prod).",
            "Verify hosting URL in CLI output.",
            "Open index.html fallback in browser.",
        ],
        "Hosting deploy succeeds; deep link files served with correct headers.",
        "firebase.json headers section sets Content-Type for AASA/assetlinks.",
    )

    # 7.11 CLI deploy verification
    doc.add_heading("7.11 Firebase CLI Deploy Verification", level=2)
    add_test_block(
        doc,
        "TEST-CLI-001: Rules deploy",
        "firebase login completed.",
        [
            "npm run firebase:deploy:dev:rules",
            "Console → Firestore → Rules → check publish time.",
            "Console → Storage → Rules → check publish time.",
        ],
        "Both rule sets updated without CLI errors.",
        None,
    )
    add_test_block(
        doc,
        "TEST-CLI-002: Indexes deploy",
        "firestore.indexes.json unchanged or updated.",
        [
            "npm run firebase:deploy:dev:indexes",
            "Console → Firestore → Indexes → all indexes Enabled.",
        ],
        "No missing index errors in app after deploy.",
        None,
    )
    add_test_block(
        doc,
        "TEST-CLI-003: Full deploy smoke test",
        "All config files committed.",
        [
            "npm run firebase:deploy:dev",
            "Confirm hosting + firestore + storage + remoteconfig sections deploy.",
        ],
        "CLI reports success for each target. No authentication errors.",
        None,
    )

    # 7.12 Attribution
    doc.add_heading("7.12 Install Attribution (Android Analytics)", level=2)
    add_test_block(
        doc,
        "TEST-AT-001: Organic install events",
        "Fresh install on Android dev build. Clear app data.",
        [
            "Install com.trackzio.mushrooms.dev APK.",
            "First launch — wait for attribution init (non-blocking).",
            "DebugView: install_referrer_received and/or install_attribution.",
        ],
        "Attribution events fire once per install (attribution_sent flag in AsyncStorage).",
        "attributionManager.ts — Android only.",
    )
    add_test_block(
        doc,
        "TEST-AT-002: Meta Install Referrer",
        "Android device with Meta app / test campaign.",
        [
            "Install via Meta ad link if available.",
            "Check DebugView for meta_referrer_received.",
            "Verify utm_source, utm_campaign params.",
        ],
        "MIR events include meta_touch, attribution_confidence params.",
        "adb logcat for [MIR] and [Attribution] traces.",
    )

    # 7.13 Google Sign-In + Firebase alignment
    doc.add_heading("7.13 Google Sign-In & Firebase SHA Alignment", level=2)
    add_test_block(
        doc,
        "TEST-GS-001: Dev APK Google Sign-In",
        "npm run android:build:dev:apk. mushrooms-app-dev Firebase.",
        [
            "Install dev release APK.",
            "Settings → App Logs — webClientId should start with 511567649411-.",
            "Sign in with Google.",
        ],
        "Sign-in succeeds. No DEVELOPER_ERROR (code 10).",
        "See docs/GOOGLE_SIGNIN_TROUBLESHOOTING.md",
    )
    add_test_block(
        doc,
        "TEST-GS-002: Prod APK Google Sign-In",
        "Upload keystore present. npm run android:build:prod:apk.",
        [
            "Verify SHA-1 of release cert registered in mushrooms-app-dfdc5 Firebase.",
            "google-services.json in android/app/src/prod/ matches prod project.",
            "GOOGLE_WEB_CLIENT_ID starts with 921492151587-.",
        ],
        "Google Sign-In works on prod release build.",
        None,
    )

    # --- 8. Quick reference ---
    doc.add_page_break()
    doc.add_heading("8. Quick Reference — What Goes Where", level=1)
    add_table(
        doc,
        ["Item", "Direction", "When"],
        [
            ["google-services.json / GoogleService-Info*.plist", "Download → repo", "New app, new SHA cert"],
            ["remoteconfig.template.json", "Upload via CLI", "Change limits, flags, URLs"],
            ["firestore.indexes.json", "Upload via CLI", "New composite queries"],
            ["firestore.rules / storage.rules", "Upload via CLI", "Security changes"],
            ["Analytics events", "Code only", "New tracking in app release"],
            ["hosting/public/*", "Upload via CLI", "Deep link / AASA updates"],
        ],
    )

    doc.add_heading("9. Related Documentation", level=1)
    add_bullets(
        doc,
        [
            "docs/FIREBASE_SETUP.md — Markdown summary",
            "docs/ENV_SETUP.md — .env.dev / .env.prod",
            "docs/GOOGLE_SIGNIN_TROUBLESHOOTING.md — SHA-1 and OAuth",
            "docs/CI_CD_SETUP.md — Release signing",
            "docs/DEEP_LINKING_PLATFORM_PLAYBOOK.md — Universal / App Links",
        ],
    )

    doc.add_heading("10. Test Case Index", level=1)
    test_index = [
        ["TEST-FB-001", "Firebase project verified"],
        ["TEST-FB-002", "Panic guard"],
        ["TEST-FB-003", "iOS plist copy"],
        ["TEST-AN-001", "Analytics DebugView"],
        ["TEST-AN-002", "Identification events"],
        ["TEST-AN-003", "Subscription events"],
        ["TEST-AN-004", "Feed events"],
        ["TEST-AN-005", "App Logs analytics errors"],
        ["TEST-AN-006", "GA4 historical reports"],
        ["TEST-CR-001", "Crashlytics off in dev"],
        ["TEST-CR-002", "Crashlytics on in release"],
        ["TEST-CR-003", "Non-fatal logError"],
        ["TEST-FS-001", "Create/read post"],
        ["TEST-FS-002", "Comments/replies"],
        ["TEST-FS-003", "Composite indexes"],
        ["TEST-FS-004", "Like/unlike"],
        ["TEST-FS-005", "Notifications subcollection"],
        ["TEST-ST-001", "Upload image"],
        ["TEST-ST-002", "Delete image"],
        ["TEST-ST-003", "Storage rules denial"],
        ["TEST-RC-001", "RC defaults offline"],
        ["TEST-RC-002", "RC fetch from Firebase"],
        ["TEST-RC-003", "quizEnabled flag"],
        ["TEST-RC-004", "Store URLs"],
        ["TEST-RC-005", "Deploy RC template"],
        ["TEST-PF-001", "App launch trace"],
        ["TEST-PF-002", "Storage upload trace"],
        ["TEST-PF-003", "Screen/API traces"],
        ["TEST-FCM-001", "FCM token"],
        ["TEST-FCM-002", "Foreground push"],
        ["TEST-FCM-003", "Background/killed tap"],
        ["TEST-FCM-004", "Console test message"],
        ["TEST-HO-001", "assetlinks.json"],
        ["TEST-HO-002", "AASA iOS"],
        ["TEST-HO-003", "Hosting deploy"],
        ["TEST-CLI-001", "Rules deploy"],
        ["TEST-CLI-002", "Indexes deploy"],
        ["TEST-CLI-003", "Full deploy"],
        ["TEST-AT-001", "Organic attribution"],
        ["TEST-AT-002", "Meta Install Referrer"],
        ["TEST-GS-001", "Dev Google Sign-In"],
        ["TEST-GS-002", "Prod Google Sign-In"],
    ]
    add_table(doc, ["Test ID", "Description"], test_index)

    os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
    doc.save(OUTPUT)
    print(f"Created: {OUTPUT}")


if __name__ == "__main__":
    build()
