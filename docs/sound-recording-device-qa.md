# Bird Sound Recording — Device QA Checklist

Use this checklist on **physical iOS and Android devices** before release.
Simulator/emulator mic behavior is not sufficient.

## Prerequisites

- [ ] Fresh install or cleared app data
- [ ] `npm run pod:install` completed on iOS after latest Podfile changes
- [ ] Release or release-candidate build (not only Metro debug) for final sign-off

---

## iOS Device

### Permissions & start

- [ ] Microphone permission prompt appears when needed
- [ ] Deny mic → recoverable UI (settings / retry)
- [ ] Grant mic → recording starts
- [ ] Live spectrogram responds to voice/clap (not static/empty)
- [ ] Silence → mostly low-intensity spectrogram (light background)

### Timer & minimum duration

- [ ] Timer advances smoothly (wall-clock based)
- [ ] Stop disabled before **9 seconds**
- [ ] Stop enabled at/after **9 seconds**
- [ ] Guidance text: "Please record at least 9 seconds"

### Pause / resume

- [ ] Pause stops timer and spectrogram updates
- [ ] Resume continues timer and spectrogram from prior duration
- [ ] Repeat: pause → resume → pause → resume → stop
- [ ] WAV plays back with expected duration after stop

### Stop & identification

- [ ] Stop shows "Processing recording…" / "Finalizing audio…"
- [ ] Navigates to crop screen with valid duration
- [ ] Crop → Identify → loading → results (or expected error modals)
- [ ] Identification does **not** run before processing overlay completes

### Location

- [ ] Location off → enable CTA visible
- [ ] Location on → place name in metadata row
- [ ] Note: location sent at **identify time**, not frozen at record start (product review)

### Lifecycle

- [ ] Back while recording → mic released, no stuck timer
- [ ] Back while paused → mic released
- [ ] App background during recording → recording cancels safely
- [ ] No mic indicator stuck on after leaving screen

### Duration stress

- [ ] **30 s** recording — spectrogram smooth, no crash, stop works
- [ ] **60 s** auto-stop or manual stop at cap — no crash, valid file

### Environments

- [ ] Quiet room (silence behavior)
- [ ] Noisy environment → "Too much background noise" hint when loud
- [ ] Real bird call or realistic playback — visible spectrogram pattern

---

## Android Device

Repeat all iOS checks above, with extra focus on:

- [ ] Pause/resume (Android requires PCM stream re-init — verify no duplicate audio)
- [ ] Release build RECORD_AUDIO permission
- [ ] WAV URI opens correctly (`file://` prefix)

---

## Fallback path (optional)

If testing on a build **without** `RNLiveAudioStream` linked:

- [ ] Static indicator shown (not live frequency view)
- [ ] Copy: "Recording audio…" + "Live frequency view unavailable on this device."
- [ ] Recording still completes and identifies

---

## Performance (SVG — no Skia yet)

On a mid-range device, during a **30–60 s** recording, observe:

- [ ] UI remains responsive (timer, pause, stop)
- [ ] No progressive slowdown over time
- [ ] No obvious memory growth / OOM

If jank is severe, file a ticket for Skia migration with device model + OS version.

---

## Expected memory profile (primary PCM path)

| Resource | ~60 s max |
|----------|-----------|
| PCM chunks | ~2.6 MB Int16 @ 22050 Hz mono |
| Spectrogram buffer | 200 columns × 48 bands |
| WAV at stop | ~2.6 MB transient merge, then released |

---

## Sign-off

| Platform | Device model | OS | Tester | Date | Pass/Fail |
|----------|--------------|-----|--------|------|-----------|
| iOS | | | | | |
| Android | | | | | |


## Dark entry-screen design acceptance — 20 November 2026

- [ ] Compare the first Identify by Sound screen against Figma 9380:170994 using the dark palette: night-sky background, bird/wave illustration, title/subtitle, location row and bottom microphone control.
- [ ] Verify no overlap on short phones/tablets and after rotation; toggle location and start recording through denied/granted/settings paths.
- [ ] Confirm Light entry and later recording/crop controls retain their existing behavior.

Source validation: TypeScript and targeted lint passed; recordingTimer and soundRecording.constants suites passed (8 tests). Physical microphone/device-render acceptance is not claimed.


## Dark crop design acceptance — 20 November 2026

- [ ] Compare Figma 9380:171133: compact copy/chips, 100-point spectrogram, red frame/grips, timestamp/location and Identify CTA.
- [ ] Confirm Dark begins with full recording; duration selection and same-chip reset work. Drag the fixed window to each boundary, then preview the selected audio by tapping the spectrogram.
- [ ] Check tap/drag arbitration, screen-reader play/pause, disabled/analyzing states and the exact crop range sent for identification.
- [ ] Repeat via SoundIdentify's in-place crop and the standalone SoundCrop route, then check Light's existing default and overlay play control.

Source checks: 4 crop/finalization/timer/constants suites / 15 tests passed; TypeScript and targeted lint passed. Real gesture/audio/device acceptance remains open.
