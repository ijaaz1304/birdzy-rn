# Cursor Prompt — Android Embedded Photo Picker Bridge (React Native)

Copy everything inside the block below into a **new Cursor chat** in any React Native repo that needs Play-compliant gallery pick on Android while keeping iOS unchanged.

---

```
Implement an Android-only React Native native bridge for Google's Embedded Photo Picker (Jetpack androidx.photopicker). iOS must stay unchanged.

## Goal

Replace Android in-app CameraRoll / READ_MEDIA_IMAGES gallery scanning with:
1. Embedded photo picker inside our existing gallery screen (primary path)
2. System photo picker fallback on unsupported devices (secondary path)

Keep the same post-selection UX: location banner, selected thumbnail, Next → crop → upload/identify.

## Hard constraints

- Do NOT change iOS gallery behavior unless explicitly broken
- Remove READ_MEDIA_IMAGES and READ_MEDIA_VIDEO from AndroidManifest (use tools:node="remove" if merged by dependencies)
- Do NOT request broad media library permission on Android API 33+
- Single-photo selection (maxSelectable = 1) unless product says otherwise
- Preserve content:// URI handling — copy to cache before preview/crop if needed

## When embedded picker is available

Android 14+ (API 34, UPSIDE_DOWN_CAKE) AND SdkExtensions extension version >= 15.

Availability check (Kotlin):
- Build.VERSION.SDK_INT >= UPSIDE_DOWN_CAKE
- SdkExtensions.getExtensionVersion(UPSIDE_DOWN_CAKE) >= 15

## Implementation checklist

### 1) Native Android (Kotlin)

Create and register a ReactPackage with:

A. EmbeddedPhotoPickerAvailability.kt
   - Static isAvailable(): Boolean using SDK + extension check above

B. EmbeddedPhotoPickerModule.kt
   - @ReactMethod isAvailable(promise) → resolves boolean

C. EmbeddedPhotoPickerViewManager.kt (SimpleViewManager<FrameLayout>)
   - REACT_CLASS = "EmbeddedPhotoPickerView"
   - Host androidx.photopicker.EmbeddedPhotoPickerView in a FrameLayout
   - Listener: EmbeddedPhotoPickerView.EmbeddedPhotoPickerStateChangeListener
   - Session type: android.widget.photopicker.EmbeddedPhotoPickerSession (NOT nested type)
   - Feature info: android.widget.photopicker.EmbeddedPhotoPickerFeatureInfo.Builder
     - setMaxSelectionLimit(1)
     - setAccentColor(Long) — React color int must be converted: accentColor.toLong() and 0xFFFFFFFFL
   - Emit events to JS:
     - onPhotoSelected { uri }
     - onPhotoDeselected { uri }
     - onSessionError { message }
   - @OptIn(ExperimentalPhotoPickerApi::class) on the manager class

D. EmbeddedPhotoPickerPackage.kt
   - Register module + view manager

E. MainApplication / ReactNativeHost
   - packages.add(EmbeddedPhotoPickerPackage())

F. android/app/build.gradle
   - implementation("androidx.photopicker:photopicker:1.0.0-alpha02")
   - kotlinOptions freeCompilerArgs += "-opt-in=androidx.photopicker.ExperimentalPhotoPickerApi"

G. proguard-rules.pro
   - -keep class androidx.photopicker.** { *; }
   - -keep class android.widget.photopicker.** { *; }

### 2) JavaScript / TypeScript

A. embeddedPhotoPicker.android.ts
   - isEmbeddedPhotoPickerAvailable(): NativeModules.EmbeddedPhotoPickerModule.isAvailable()

B. embeddedPhotoPicker.ts (default stub)
   - isEmbeddedPhotoPickerAvailable(): false

C. EmbeddedAndroidPhotoPicker.tsx
   - requireNativeComponent("EmbeddedPhotoPickerView")
   - Props: maxSelectable, accentColor, onPhotoSelected, onPhotoDeselected, onSessionError

D. Gallery / picker screen — platform split
   - iOS: existing CameraRoll grid + photos permission popup (unchanged)
   - Android:
     - On mount: check isEmbeddedPhotoPickerAvailable()
     - If true: render EmbeddedAndroidPhotoPicker in grid area; skip storage permission
     - If false: fallback to launchImageLibrary / pickImageFromGallery on focus; show "Choose from Gallery" to retry
     - Footer: keep location banner + thumbnail + Next

E. Entry points (camera / identify)
   - Platform.OS === "android" → navigate to gallery screen without storage permission gate

F. permission.service.ts
   - Android API 33+: checkStoragePermission / requestStoragePermission return granted (picker flows)

G. resolveGalleryPhotoUri / ensureLoadableUri
   - Android content:// URIs must copy to file:// cache before Image/cropper

### 3) AndroidManifest.xml

- Remove READ_MEDIA_IMAGES / READ_MEDIA_VIDEO
- Keep READ_EXTERNAL_STORAGE maxSdkVersion="32" only if legacy fallback needs it

## Common Kotlin compile errors (fix these)

| Error | Fix |
|-------|-----|
| Experimental PhotoPicker API | @OptIn(ExperimentalPhotoPickerApi::class) + gradle opt-in flag |
| setAccentColor Int vs Long | Pass Long; convert from React color int |
| EmbeddedPhotoPickerSession unresolved | import android.widget.photopicker.EmbeddedPhotoPickerSession |
| onSessionOpened overrides nothing | Session param must be EmbeddedPhotoPickerSession, not nested View type |
| setMaxSelectableMedia not found | Use setMaxSelectionLimit(n) on Builder |

## Verification

1. ./gradlew :app:compileProdDebugKotlin (or project flavor) succeeds
2. Android 14+ device: embedded picker renders inside gallery screen
3. Older Android: system picker fallback works; no crash on cancel
4. iOS: gallery grid + permission flow unchanged
5. Merged manifest has no READ_MEDIA_IMAGES
6. End-to-end: select photo → preview → Next → crop → backend flow

## Adapt to this repo

Before coding, locate and map equivalents for:
- Gallery screen component path
- Camera / identify entry that opens gallery
- Location banner component (keep as-is)
- Image crop + upload pipeline
- Permission service module path
- MainApplication package registration pattern

Minimize diff scope — only touch Android gallery path + shared URI/permission helpers needed for content:// handling.

## Deliverables

- Working native bridge (Package, Module, ViewManager, Availability)
- JS wrapper + platform-specific gallery screen split
- Manifest + permission updates for Play compliance
- Brief docs: prod summary (docx optional) + code notes (md)

Do not commit unless asked. Match existing code style, naming, and folder conventions in the target repo.
```

---

## How to use in another repo

1. Open Cursor in the target React Native project.
2. Paste the prompt block above into Agent mode.
3. Point Cursor at your gallery screen, camera entry, and `MainApplication` if paths differ from this repo.
4. Run `npm run android` (or your flavor) and fix any compile errors using the table in the prompt.

## Reference implementation (this repo)

| Artifact | Path |
|----------|------|
| Code notes | `docs/android-embedded-photo-picker-bridge.md` |
| Prod summary | `docs/Android-Embedded-Photo-Picker-Bridge.docx` |
| Native bridge | `android/app/src/main/java/com/trackzio/mushrooms/EmbeddedPhotoPicker*.kt` |
| JS wrapper | `src/features/camera/components/EmbeddedAndroidPhotoPicker.tsx` |
| Gallery screen | `src/features/camera/screens/GalleryPickerScreen.tsx` |
