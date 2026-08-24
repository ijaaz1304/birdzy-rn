# Android Embedded Photo Picker — Complete Implementation Guide

A portable reference for how Shroom-Ai picks gallery photos on Android **without broad storage permissions** (`READ_MEDIA_IMAGES`). Use this document to replicate the same pattern in another React Native app.

---

## What “Embedded” Means

In this project, **embedded** refers to **Google’s Android Embedded Photo Picker** (`androidx.photopicker`), not on-device ML inference.

| Term | Meaning in this app |
|------|---------------------|
| **Embedded Photo Picker** | System photo picker UI rendered **inside your screen** via a native view |
| **No “reading images”** | No `READ_MEDIA_IMAGES` / no CameraRoll scan of the full library |
| **Temporary access** | User grants access to **one selected photo** via `content://` URI |
| **Cache copy** | App copies that URI to app cache (`file://`) for preview, crop, and upload |

The user still selects a photo from their gallery — the difference is **how** access is granted: picker-based, scoped URIs instead of blanket media-library permission.

---

## Why Not Use READ_MEDIA_IMAGES?

Google Play expects apps to use the **Photo Picker** when they only need occasional photo access (e.g. “pick one image to identify”). Broad storage permission is for apps whose core purpose is managing the full photo library.

**Our approach:**

- Remove `READ_MEDIA_IMAGES` and `READ_MEDIA_VIDEO` from the manifest
- On Android 13+ (API 33+), treat storage permission checks as **already granted** (picker handles access)
- Embed the system picker in-app on supported devices
- Fall back to the system picker (`react-native-image-picker`) on older devices

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         REACT NATIVE (JavaScript)                        │
├─────────────────────────────────────────────────────────────────────────┤
│  CameraScreen                                                            │
│    └─ Android: navigate("GalleryPicker") — no storage permission gate   │
│                                                                          │
│  GalleryPickerScreen                                                     │
│    ├─ isEmbeddedPhotoPickerAvailable()?                                  │
│    ├─ YES → EmbeddedAndroidPhotoPicker (native view in screen)           │
│    └─ NO  → "Choose from Gallery" → react-native-image-picker fallback  │
│                                                                          │
│  GalleryPickerGrid (Android)                                             │
│    └─ onPhotoSelected(content://) → resolvePreviewImageUri() → cache    │
│                                                                          │
│  User taps Next                                                          │
│    └─ resolveGalleryPhotoUri() → submitProcessedImageForIdentify()      │
│         └─ DiagnosisLoadingScreen → API upload (FormData)               │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         ANDROID NATIVE (Kotlin)                          │
├─────────────────────────────────────────────────────────────────────────┤
│  EmbeddedPhotoPickerPackage                                              │
│    ├─ EmbeddedPhotoPickerModule.isAvailable()                            │
│    └─ EmbeddedPhotoPickerViewManager → EmbeddedPhotoPickerView           │
│         └─ androidx.photopicker (Jetpack)                                │
│              └─ onUriPermissionGranted → emit content:// URI to JS         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Complete Flow (Android Gallery → Identify)

### Step 1 — Open gallery (no permission prompt)

**File:** `src/features/camera/CameraScreen.tsx`

On Android, tapping Gallery navigates directly to `GalleryPicker`. No `checkStoragePermission()` gate.

```typescript
if (Platform.OS === "android") {
  navigation.navigate("GalleryPicker");
  return;
}
```

### Step 2 — Check embedded picker availability

**Files:**
- `src/features/camera/embeddedPhotoPicker.android.ts`
- `src/features/camera/embeddedPhotoPicker.ts` (iOS stub — always `false`)

```typescript
// embeddedPhotoPicker.android.ts
export async function isEmbeddedPhotoPickerAvailable(): Promise<boolean> {
  const module = NativeModules.EmbeddedPhotoPickerModule;
  if (!module?.isAvailable) return false;
  return module.isAvailable();
}
```

**Native check** (`EmbeddedPhotoPickerAvailability.kt`):

- Android 14+ (API 34, `UPSIDE_DOWN_CAKE`)
- SDK extension version ≥ 15

### Step 3 — Render embedded picker OR fallback

**File:** `src/features/camera/screens/GalleryPickerScreen.tsx`

| Condition | UI |
|-----------|-----|
| `isEmbeddedPhotoPickerAvailable() === true` | Native `EmbeddedAndroidPhotoPicker` fills the grid area |
| `false` | Button → `openPickerWithCrop()` via `react-native-image-picker` |

### Step 4 — User selects a photo

**File:** `src/features/camera/components/GalleryPickerGrid.tsx`

Native emits `onPhotoSelected` with a **`content://` URI**.

**Important:** Copy to cache **immediately** while the picker URI permission is still valid:

```typescript
const handlePhotoSelected = (event) => {
  const uri = event.nativeEvent.uri; // content://...
  void resolvePreviewImageUri(uri)
    .then((previewUri) => {
      // previewUri is file:// in app cache
      setSelected({ id: uri, uri: previewUri });
    });
};
```

### Step 5 — User taps Next

**File:** `src/features/camera/screens/GalleryPickerScreen.tsx`

Android embedded path **skips the second native cropper** and goes straight to analysis:

```typescript
const resolvedUri = await resolveGalleryPhotoUri(selected);
await submitCroppedFromGallery(buildGalleryImage(resolvedUri, ...));
```

iOS still exports from Photos → opens interactive cropper → then submits.

### Step 6 — Resolve URI for upload

**File:** `src/features/camera/resolveGalleryPhotoUri.ts`

Android: pass the photo URI through `ensureLoadableUri()`.

**File:** `src/features/camera/camera.utils.ts`

```typescript
export const ensureLoadableUri = async (uri: string): Promise<string> => {
  if (Platform.OS === "android" && uri.startsWith("content://")) {
    // Copy content:// → file:// in CachesDirectoryPath
    const fileUri = await copyAndroidContentUriToCache(uri);
    await verifyImageLoads(fileUri); // Image.getSize()
    return fileUri;
  }
  return uri;
};
```

Copy uses `react-native-fs`:

1. Try `RNFS.copyFile(contentUri, cachePath)`
2. Fallback: `readFile(base64)` → `writeFile(base64)`

React Native `<Image>`, cropper libraries, and `FormData` upload all need a **`file://`** path on Android — raw `content://` often fails.

### Step 7 — Submit for identification

**File:** `src/features/camera/identifyImageFlow.ts`

```typescript
await submitProcessedImageForIdentify({
  image: cropped,
  shouldPreprocess: false,
  navigation,
  replace: true, // replace GalleryPicker so back skips it
});
// → navigates to DiagnosisLoading
```

### Step 8 — Upload to backend

**Files:**
- `src/features/camera/screens/DiagnosisLoadingScreen.tsx`
- `src/services/ai/ai.service.ts`
- `src/services/api/features/core.api.ts`

Images are uploaded as multipart `FormData` via **`fetch`** (not axios — avoids Android multipart network errors):

```typescript
const formData = new FormData();
files.forEach((file) => formData.append("files", file));
await fetch(url, { method: "POST", body: formData });
```

Each file object: `{ uri: "file://...", type: "image/jpeg", name: "..." }`.

---

## Native Bridge Implementation

### File structure

```
android/app/src/main/java/com/yourapp/
├── EmbeddedPhotoPickerPackage.kt      # Registers module + view manager
├── EmbeddedPhotoPickerModule.kt       # isAvailable() for JS
├── EmbeddedPhotoPickerAvailability.kt # API 34 + extension 15 check
└── EmbeddedPhotoPickerViewManager.kt  # Hosts EmbeddedPhotoPickerView
```

### Register in MainApplication

```kotlin
// MainApplication.kt
override fun getPackages(): List<ReactPackage> =
  PackageList(this).packages.apply {
    add(EmbeddedPhotoPickerPackage())
  }
```

### Native module API

| Export | Type | Description |
|--------|------|-------------|
| `EmbeddedPhotoPickerModule.isAvailable()` | Promise\<boolean\> | Device supports embedded picker |

### Native view API

**View name:** `EmbeddedPhotoPickerView`

| Prop | Type | Default |
|------|------|---------|
| `maxSelectable` | int | 1 |
| `accentColor` | color | app primary |

| Event | Payload |
|-------|---------|
| `onPhotoSelected` | `{ uri: string }` |
| `onPhotoDeselected` | `{ uri: string }` |
| `onSessionError` | `{ message: string }` |

### ViewManager essentials

**File:** `EmbeddedPhotoPickerViewManager.kt`

1. Wrap `androidx.photopicker.EmbeddedPhotoPickerView` in a `FrameLayout`
2. Use `PickerTouchContainer` that returns `false` from `onInterceptTouchEvent` — prevents RN parent from stealing scroll gestures
3. Set provider: `EmbeddedPhotoPickerProviderFactory.create(context)`
4. On `onSessionOpened` → store session, call `session.notifyResized(width, height)`
5. On `onUriPermissionGranted(uris)` → emit each URI to JS
6. Sync size on layout changes via `addOnLayoutChangeListener`

### Gradle dependency

**File:** `android/app/build.gradle`

```gradle
dependencies {
    implementation("androidx.photopicker:photopicker:1.0.0-alpha02")
}

kotlinOptions {
    freeCompilerArgs += "-opt-in=androidx.photopicker.ExperimentalPhotoPickerApi"
}
```

Annotate Kotlin classes with `@OptIn(ExperimentalPhotoPickerApi::class)`.

### Common native build fixes

| Issue | Fix |
|-------|-----|
| `EmbeddedPhotoPickerSession` unresolved | Import `android.widget.photopicker.EmbeddedPhotoPickerSession` |
| `setAccentColor` type mismatch | Convert React color int: `accentColor.toLong() and 0xFFFFFFFFL` |
| Alpha API warnings | Add compiler opt-in flag (see above) |

---

## JavaScript Layer

### Platform-specific availability check

```
src/features/camera/
├── embeddedPhotoPicker.ts           # default: returns false (iOS + Metro fallback)
├── embeddedPhotoPicker.android.ts   # calls native isAvailable()
└── components/
    └── EmbeddedAndroidPhotoPicker.tsx  # requireNativeComponent wrapper
```

```typescript
// EmbeddedAndroidPhotoPicker.tsx
const NativeEmbeddedPhotoPicker = requireNativeComponent("EmbeddedPhotoPickerView");

export const EmbeddedAndroidPhotoPicker = (props) => (
  <NativeEmbeddedPhotoPicker {...props} collapsable={false} style={{ flex: 1 }} />
);
```

### Selection state

**File:** `src/features/camera/galleryPickerSelection.store.ts`

Stores `{ id, uri }` where:

- `id` — original `content://` URI (for deselect matching)
- `uri` — cached `file://` URI (for thumbnail preview)

---

## Permissions & Manifest

### AndroidManifest.xml

```xml
<!-- REMOVE broad media access (Play compliance) -->
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" tools:node="remove" />
<uses-permission android:name="android.permission.READ_MEDIA_VIDEO" tools:node="remove" />

<!-- Legacy only (API 32 and below) -->
<uses-permission
  android:name="android.permission.READ_EXTERNAL_STORAGE"
  android:maxSdkVersion="32" />

<!-- Package visibility for picker -->
<queries>
  <intent>
    <action android:name="android.intent.action.PICK" />
    <data android:mimeType="image/*" />
  </intent>
  <intent>
    <action android:name="com.android.photopicker.core.embedded.EmbeddedService.BIND" />
  </intent>
</queries>
```

### Permission service (Android 13+)

**File:** `src/services/permissions/permission.service.ts`

```typescript
// Android 13+: photo picker / embedded picker — no broad media library access.
if (Platform.OS === "android" && Number(Platform.Version) >= 33) {
  return { granted: true, status: "granted", canRequestAgain: false };
}
```

---

## ProGuard

**File:** `android/app/proguard-rules.pro`

```
-keep class androidx.photopicker.** { *; }
-keep class android.widget.photopicker.** { *; }
```

---

## Device Support Matrix

| Environment | Gallery behavior |
|-------------|------------------|
| Android 14+ with SDK extension ≥ 15 | Embedded picker rendered in-screen |
| Android 13 or older / unsupported extension | System picker fallback (`react-native-image-picker`) |
| iOS | Unchanged — CameraRoll grid + Photos permission |

---

## Android vs iOS Comparison

| Aspect | Android (embedded) | iOS |
|--------|-------------------|-----|
| Storage permission | Not required (API 33+) | `PHOTO_LIBRARY` required |
| Gallery UI | System picker embedded in screen | In-app CameraRoll grid |
| Selected URI | `content://` → copy to cache | `ph://` → Photos export |
| Crop on Next | Skipped (direct to analysis) | Export → native cropper → analysis |
| Preview copy timing | Immediately on select | On export / Next |

---

## Fallback Path (Older Android)

When `isEmbeddedPhotoPickerAvailable()` returns `false`:

1. Show “Choose from Gallery” button
2. Call `openPickerWithCrop()` → `react-native-image-picker` + `react-native-image-crop-picker`
3. Returns a cropped `file://` image
4. Same submit → DiagnosisLoading → API flow

No `READ_MEDIA_IMAGES` is needed for this path either — the system picker grants temporary URI access.

---

## Camera Capture Path (Separate from Gallery)

Camera photos do not use the embedded picker:

1. `react-native-vision-camera` → `PhotoFile.path` (`file://`)
2. Crop to on-screen frame
3. Optional interactive crop screen
4. Same `submitProcessedImageForIdentify()` → API

---

## Dependencies

| Package | Role |
|---------|------|
| `androidx.photopicker:photopicker:1.0.0-alpha02` | Embedded picker (native) |
| `react-native-image-picker` | Android fallback gallery |
| `react-native-image-crop-picker` | Crop UI (fallback + iOS) |
| `react-native-fs` | Copy `content://` → app cache |
| `@react-native-camera-roll/camera-roll` | iOS photo library only |
| `react-native-vision-camera` | Camera capture |

---

## Porting Checklist (Another App)

Copy and adapt in this order:

- [ ] **1. Native bridge** — Copy 4 Kotlin files; register `EmbeddedPhotoPickerPackage` in `MainApplication`
- [ ] **2. Gradle** — Add `androidx.photopicker` dependency + `@OptIn` compiler flag
- [ ] **3. Manifest** — Remove `READ_MEDIA_*`; add embedded picker `<queries>` intent
- [ ] **4. ProGuard** — Keep photopicker classes
- [ ] **5. JS availability** — `embeddedPhotoPicker.android.ts` + iOS stub
- [ ] **6. Native component** — `EmbeddedAndroidPhotoPicker.tsx` with `requireNativeComponent`
- [ ] **7. Gallery screen** — Branch on `isEmbeddedPhotoPickerAvailable()`; render embedded view or fallback
- [ ] **8. URI helper** — Implement `ensureLoadableUri()` to copy `content://` → cache before Image/crop/upload
- [ ] **9. Immediate preview copy** — On `onPhotoSelected`, call `resolvePreviewImageUri()` before permission expires
- [ ] **10. Permissions** — Auto-grant storage checks on Android API 33+
- [ ] **11. Upload** — Use `fetch` + `FormData` for multipart on Android
- [ ] **12. Test** — Android 14+ device/emulator with Google Play services

---

## Key Files Reference (Shroom-Ai)

### Android native

| File | Purpose |
|------|---------|
| `android/app/src/main/java/com/trackzio/mushrooms/EmbeddedPhotoPickerPackage.kt` | Package registration |
| `android/app/src/main/java/com/trackzio/mushrooms/EmbeddedPhotoPickerModule.kt` | `isAvailable()` module |
| `android/app/src/main/java/com/trackzio/mushrooms/EmbeddedPhotoPickerAvailability.kt` | Device capability check |
| `android/app/src/main/java/com/trackzio/mushrooms/EmbeddedPhotoPickerViewManager.kt` | Native view host |
| `android/app/build.gradle` | Photopicker dependency |
| `android/app/src/main/AndroidManifest.xml` | Permissions + queries |
| `android/app/proguard-rules.pro` | Release keep rules |

### JavaScript / TypeScript

| File | Purpose |
|------|---------|
| `src/features/camera/embeddedPhotoPicker.android.ts` | Native availability check |
| `src/features/camera/embeddedPhotoPicker.ts` | iOS stub |
| `src/features/camera/components/EmbeddedAndroidPhotoPicker.tsx` | RN native view wrapper |
| `src/features/camera/components/GalleryPickerGrid.tsx` | Embedded grid + selection handler |
| `src/features/camera/screens/GalleryPickerScreen.tsx` | Platform-split gallery screen |
| `src/features/camera/camera.utils.ts` | `ensureLoadableUri`, `resolvePreviewImageUri` |
| `src/features/camera/resolveGalleryPhotoUri.ts` | Resolve photo for crop/upload |
| `src/features/camera/identifyImageFlow.ts` | Submit → DiagnosisLoading navigation |
| `src/features/camera/CameraScreen.tsx` | Android skips storage gate |
| `src/services/permissions/permission.service.ts` | API 33+ auto-grant |

### Related docs

| File | Purpose |
|------|---------|
| `docs/android-embedded-photo-picker-bridge.md` | Short code-level notes |
| `docs/cursor-prompt-android-embedded-photo-picker.md` | Copy-paste implementation prompt |

---

## What This Does NOT Cover

- **On-device ML inference** — Mushroom identification is server-side (`POST /core/ai/identify`). There are no `.tflite` / `.onnx` model assets in this flow.
- **Reading the entire photo library** — That would require `READ_MEDIA_IMAGES` + CameraRoll indexing (iOS-style grid on Android). We intentionally avoid that.
- **Zero disk access** — The app still writes a cache copy of the selected photo. Scoped picker access + cache copy is the Play-compliant pattern.

---

## Quick Mental Model

```
Old way:  Permission → scan all photos → pick from grid → upload
Our way:  Open picker → user picks one → temporary content:// → copy to cache → upload
```

The embedded picker makes the second path feel native by placing the **system picker UI inside your screen**, without requesting access to every photo on the device.
