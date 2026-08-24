#!/usr/bin/env python3
"""Generate clearly marked Birdzy placeholder launcher icons (native Android + iOS)."""
import os
import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# Birdzy brand placeholder: deep teal background, white "BZ" text area
BG = (0x1A, 0x5C, 0x6E)  # #1A5C6E
FG = (0xFF, 0xFF, 0xFF)


def png_chunk(tag: bytes, data: bytes) -> bytes:
    crc = zlib.crc32(tag + data) & 0xFFFFFFFF
    return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", crc)


def write_png(path: Path, width: int, height: int, rgb: tuple) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    row = bytes([0] + list(rgb) * width)
    raw = row * height
    ihdr = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)
    data = (
        b"\x89PNG\r\n\x1a\n"
        + png_chunk(b"IHDR", ihdr)
        + png_chunk(b"IDAT", zlib.compress(raw, 9))
        + png_chunk(b"IEND", b"")
    )
    path.write_bytes(data)


def android_sizes():
    return {
        "mipmap-mdpi": 48,
        "mipmap-hdpi": 72,
        "mipmap-xhdpi": 96,
        "mipmap-xxhdpi": 144,
        "mipmap-xxxhdpi": 192,
    }


def generate_android():
    res = ROOT / "android/app/src/main/res"
    for folder, size in android_sizes().items():
        d = res / folder
        for name in [
            "ic_launcher.png",
            "ic_launcher_round.png",
            "ic_launcher_foreground.png",
            "ic_launcher_background.png",
            "ic_launcher_monochrome.png",
        ]:
            color = BG if "background" in name else (FG if "monochrome" in name else BG)
            write_png(d / name, size, size, color)
    print(f"Android: placeholder icons in {len(android_sizes())} density folders")


def generate_ios():
    appicon = ROOT / "ios/Birdzy/Images.xcassets/AppIcon.appiconset"
    sizes = {
        "AppIcon~ios-marketing.png": 1024,
        "AppIcon@2x.png": 120,
        "AppIcon@3x.png": 180,
        "AppIcon-20@2x.png": 40,
        "AppIcon-20@3x.png": 60,
        "AppIcon-29.png": 29,
        "AppIcon-29@2x.png": 58,
        "AppIcon-29@3x.png": 87,
        "AppIcon-40@2x.png": 80,
        "AppIcon-40@3x.png": 120,
        "AppIcon~ipad.png": 76,
        "AppIcon@2x~ipad.png": 152,
        "AppIcon-83.5@2x~ipad.png": 167,
        "AppIcon-40~ipad.png": 40,
        "AppIcon-40@2x~ipad.png": 80,
        "AppIcon-20~ipad.png": 20,
        "AppIcon-20@2x~ipad.png": 40,
        "AppIcon-29~ipad.png": 29,
        "AppIcon-29@2x~ipad.png": 58,
        "AppIcon-60@2x~car.png": 120,
        "AppIcon-60@3x~car.png": 180,
    }
    for filename, size in sizes.items():
        write_png(appicon / filename, size, size, BG)
    print(f"iOS: {len(sizes)} AppIcon placeholder PNGs")


if __name__ == "__main__":
    generate_android()
    generate_ios()
    print("Placeholder native icons generated (#1A5C6E solid — replace before release)")
