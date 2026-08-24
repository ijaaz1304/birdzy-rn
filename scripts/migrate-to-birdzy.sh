#!/usr/bin/env bash
# Birdzy migration script — transforms cloned Shroom-Ai into independent Birdzy app.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "=== Birdzy Migration ==="
echo "Root: $ROOT"

# ─── 1. iOS native renames ───────────────────────────────────────────────────
echo "--- iOS renames ---"
if [ -d "ios/ShroomAI" ] && [ ! -d "ios/Birdzy" ]; then
  mv ios/ShroomAI ios/Birdzy
fi
if [ -f "ios/ShroomAI/GoogleService-Info.plist" ]; then
  mv ios/ShroomAI/GoogleService-Info.plist ios/Birdzy/ 2>/dev/null || true
fi
if [ -f "ios/ShroomAI/GoogleService-Info-Dev.plist" ]; then
  mv ios/ShroomAI/GoogleService-Info-Dev.plist ios/Birdzy/ 2>/dev/null || true
fi
if [ -d "ios/ShroomAI.xcodeproj" ] && [ ! -d "ios/Birdzy.xcodeproj" ]; then
  mv ios/ShroomAI.xcodeproj ios/Birdzy.xcodeproj
fi
if [ -d "ios/ShroomAI.xcworkspace" ] && [ ! -d "ios/Birdzy.xcworkspace" ]; then
  mv ios/ShroomAI.xcworkspace ios/Birdzy.xcworkspace
fi

# Rename entitlements
for f in ios/Birdzy/ShroomAIRelease-Prod.entitlements ios/Birdzy/ShroomAIRelease-Dev.entitlements; do
  if [ -f "$f" ]; then
    newname=$(echo "$f" | sed 's/ShroomAI/Birdzy/g')
    mv "$f" "$newname"
  fi
done

# Rename scheme files
for f in ios/Birdzy.xcodeproj/xcshareddata/xcschemes/*.xcscheme; do
  [ -f "$f" ] || continue
  newname=$(echo "$f" | sed 's/ShroomAI/Birdzy/g')
  if [ "$f" != "$newname" ]; then mv "$f" "$newname"; fi
done

# Remove legacy workspace if present
rm -rf ios/RockAndMinerals.xcworkspace 2>/dev/null || true

# ─── 2. Android package directory rename ─────────────────────────────────────
echo "--- Android package rename ---"
for srcdir in android/app/src/main/java/com/trackzio/mushrooms \
              android/app/src/dev/java/com/trackzio/mushrooms \
              android/app/src/prod/java/com/trackzio/mushrooms; do
  if [ -d "$srcdir" ]; then
    destdir=$(echo "$srcdir" | sed 's/mushrooms/birds/g')
    mkdir -p "$(dirname "$destdir")"
    mv "$srcdir" "$destdir"
  fi
done

# ─── 3. Text replacements in files ───────────────────────────────────────────
echo "--- Text replacements ---"

# Files to process (exclude node_modules, build artifacts, binary)
find "$ROOT" \
  -type f \
  \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \
     -o -name "*.json" -o -name "*.gradle" -o -name "*.xml" -o -name "*.plist" \
     -o -name "*.pbxproj" -o -name "*.xcscheme" -o -name "*.xcconfig" \
     -o -name "*.entitlements" -o -name "*.md" -o -name "*.html" -o -name "*.kt" \
     -o -name "*.java" -o -name "*.properties" -o -name "*.rb" -o -name "*.sh" \
     -o -name "*.env" -o -name ".env*" -o -name "Podfile" -o -name "Podfile.lock" \
     -o -name "app.json" -o -name "Gemfile" -o -name "*.template.json" \
     -o -name "*.rules" -o -name ".firebaserc" -o -name "firebase.json" \) \
  ! -path "*/node_modules/*" \
  ! -path "*/Pods/*" \
  ! -path "*/build/*" \
  ! -path "*/.gradle/*" \
  ! -path "*/scripts/migrate-to-birdzy.sh" \
  -print0 | while IFS= read -r -d '' file; do
  # Skip binary-ish files
  if file "$file" | grep -q "binary\|image\|archive"; then continue; fi

  sed -i '' \
    -e 's/com\.trackzio\.mushrooms\.dev/com.trackzio.birds.dev/g' \
    -e 's/com\.trackzio\.mushrooms/com.trackzio.birds/g' \
    -e 's/com\.trackzio\.mushroom/com.trackzio.bird/g' \
    -e 's/shroomai-dev/birdzy-dev/g' \
    -e 's/shroomai_dl/birdzy_dl/g' \
    -e 's/shroomai/birdzy/g' \
    -e 's/ShroomAI-Dev/Birdzy-Dev/g' \
    -e 's/ShroomAI/Birdzy/g' \
    -e 's/SHROOMAI/BIRDZY/g' \
    -e 's/Shroomzy Dev/Birdzy Dev/g' \
    -e 's/Shroomzy/Birdzy/g' \
    -e 's/shroomzy/birdzy/g' \
    -e 's/SHROOMZY/BIRDZY/g' \
    "$file" 2>/dev/null || true
done

# Fix workspace contents reference
if [ -f "ios/Birdzy.xcworkspace/contents.xcworkspacedata" ]; then
  sed -i '' 's/ShroomAI/Birdzy/g' ios/Birdzy.xcworkspace/contents.xcworkspacedata
fi

echo "=== Migration script complete ==="
