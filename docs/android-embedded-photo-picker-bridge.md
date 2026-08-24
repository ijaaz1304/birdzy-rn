# Android Embedded Photo Picker — Code-Level Notes

Brief reference for the React Native bridge that embeds Google’s Android photo picker in the Identify gallery flow. **iOS is unchanged** (CameraRoll grid).

> **Reuse in other repos:** copy-paste prompt → [`cursor-prompt-android-embedded-photo-picker.md`](./cursor-prompt-android-embedded-photo-picker.md)

## Architecture

```
GalleryPickerScreen (JS)
├── iOS  → useDevicePhotoLibrary + GalleryPhotoGrid + photos permission
└── Android
     ├── isEmbeddedPhotoPickerAvailable() ──► EmbeddedPhotoPickerModule (native)
     ├── supported ──► EmbeddedAndroidPhotoPicker ──► EmbeddedPhotoPickerViewManager
     └── fallback  ──► pickImageFromGallery() (react-native-image-picker)
```

## Native Android (Kotlin)

| File | Role |
|------|------|
| `EmbeddedPhotoPickerPackage.kt` | Registers module + view manager with React Native |
| `EmbeddedPhotoPickerModule.kt` | `isAvailable()` promise for JS |
| `EmbeddedPhotoPickerAvailability.kt` | Android 14+ (API 34) with SDK extension ≥ 15 |
| `EmbeddedPhotoPickerViewManager.kt` | Wraps `androidx.photopicker.EmbeddedPhotoPickerView` |

**Dependency:** `androidx.photopicker:photopicker:1.0.0-alpha02` in `android/app/build.gradle`

**Opt-in:** `@OptIn(ExperimentalPhotoPickerApi::class)` + compiler flag  
`-opt-in=androidx.photopicker.ExperimentalPhotoPickerApi`

**Registration:** `MainApplication.kt` → `add(EmbeddedPhotoPickerPackage())`

### View manager contract

| Prop | Type | Default |
|------|------|---------|
| `maxSelectable` | int | 1 |
| `accentColor` | color (Long on native) | app primary |

| Event | Payload |
|-------|---------|
| `onPhotoSelected` | `{ uri: string }` |
| `onPhotoDeselected` | `{ uri: string }` |
| `onSessionError` | `{ message: string }` |

Native view name: `EmbeddedPhotoPickerView`

## JavaScript / TypeScript

| File | Role |
|------|------|
| `embeddedPhotoPicker.android.ts` | Calls `NativeModules.EmbeddedPhotoPickerModule.isAvailable()` |
| `embeddedPhotoPicker.ts` | iOS/stub — always returns `false` |
| `components/EmbeddedAndroidPhotoPicker.tsx` | `requireNativeComponent` wrapper |
| `screens/GalleryPickerScreen.tsx` | Platform split: embedded vs system fallback vs iOS grid |

### Android gallery flow

1. On mount, check `isEmbeddedPhotoPickerAvailable()`.
2. **Embedded path:** render `EmbeddedAndroidPhotoPicker` in grid area; no storage permission.
3. **Fallback path:** auto-open `pickImageFromGallery()` on focus; show “Choose from Gallery” if dismissed.
4. Footer unchanged: `IdentificationLocationBanner` + thumbnail + **Next** → crop → identify.

### Related JS changes

- `CameraScreen.tsx` — Android skips storage gate; navigates directly to `GalleryPicker`.
- `permission.service.ts` — Android API 33+ storage checks return granted (picker-based flows).
- `resolveGalleryPhotoUri.ts` — allows Android `content://` URIs via `ensureLoadableUri()`.

## Manifest & Play compliance

`AndroidManifest.xml`:

- Removed broad access: `READ_MEDIA_IMAGES`, `READ_MEDIA_VIDEO` (`tools:node="remove"`).
- Kept `READ_EXTERNAL_STORAGE` with `maxSdkVersion="32"` for legacy devices.

No `READ_MEDIA_*` required for embedded or system picker on API 33+.

## ProGuard

`android/app/proguard-rules.pro`:

```
-keep class androidx.photopicker.** { *; }
-keep class android.widget.photopicker.** { *; }
```

## Device support

| Environment | Behavior |
|-------------|----------|
| Android 14+ with extension ≥ 15 | Embedded picker in-screen |
| Older / unsupported Android | System picker fallback |
| iOS | Existing CameraRoll grid (no bridge) |

## Local verification

```bash
npm run android:prod   # or android:dev
```

Test Identify → Gallery on an Android 14+ device/emulator with Google Play services / photo picker extension.

## Build fixes applied

- `EmbeddedPhotoPickerSession` import from `android.widget.photopicker`
- `setAccentColor(Long)` — convert React color int to `Long`
- `@OptIn(ExperimentalPhotoPickerApi::class)` for alpha photopicker APIs
