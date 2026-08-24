#!/usr/bin/env bash
set -euo pipefail

# Prefer Homebrew Ruby over macOS system Ruby (2.6) for CocoaPods / Bundler.
if command -v brew >/dev/null 2>&1; then
  RUBY_PREFIX="$(brew --prefix ruby 2>/dev/null || true)"
  if [ -n "${RUBY_PREFIX}" ] && [ -d "${RUBY_PREFIX}/bin" ]; then
    export PATH="${RUBY_PREFIX}/bin:${PATH}"
  fi
fi

for prefix in /opt/homebrew/opt/ruby /usr/local/opt/ruby; do
  if [ -d "${prefix}/bin" ]; then
    export PATH="${prefix}/bin:${PATH}"
    break
  fi
done

exec "$@"
