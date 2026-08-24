# Remaining root icons (`/icons`)

**Last updated:** 2026-08-22

The project root `icons/` folder is **empty** — all Birdzy art has been migrated into `src/assets/`.

---

## Where the last batch went

| Root icon | App destination | `Images` key |
|-----------|-----------------|--------------|
| `alert.webp` | `identification/light/alert.webp` | `identificationAlertIcon` |
| `alert_camera.webp` | `common/iconfix/alert_camera.webp` | `alertCameraIcon` |
| `scan_error.webp` | `identification/light/scan_error.webp` | `aiScanError` |
| `small/medium/large/very_large_bird_identificaion.webp` | `identification/light/bird_size/*.webp` | `identificationTipBird*` |
| `play/pause/record/record_stop/volume-high.webp` | `common/iconfix/sound/*.webp` | `soundPlay`, `soundPause`, etc. |
| `details_record.webp` | `collection/details/sound/record_cta.webp` | `soundRecordCta` |
| `sound_details.webp` | `collection/details/sound/sound_details.webp` | `soundDetailsIcon` |
| `edit/save/move.webp` | `common/iconfix/*.webp` | `iconEdit`, `iconSave`, `iconMove` |
| `storage_popup.webp` | `home/popup/mushroom/light|dark/storage_permission_bg.webp` | `popupStoragePermissionBg` |
| `discount_sticky_banner_gift_icon.webp` | `home/discount_sticky_banner_gift_icon.webp` | `homeGiftBox` |
| `feature_bird_today.webp` | subscription carousel/list + home bird-of-day art | `subscriptionIconMushroomOfDay`, etc. |

Full migration log: [`docs/icon-migration-map.json`](icon-migration-map.json)

---

## Optional follow-ups

- Surface **bird size tips** in `CameraTipsModal` / identify hub (assets exist; UI row not added yet).
- Use `soundDetailsIcon` on bird detail sounds empty state if desired.
- Use `iconSave` on edit-details save bar and AppSheet rename/create flows.

When adding new root art, copy into `src/assets/…`, register in `src/assets/index.ts`, then delete from `/icons`.
