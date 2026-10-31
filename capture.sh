#!/usr/bin/env bash
# Capture desktop and mobile screenshots of CAPTURE_URL into CAPTURE_DIR.
set -uo pipefail

run() {
  echo "+ $*" >&2
  /usr/bin/time -p "$@"
}

: "${CAPTURE_URL:?Set CAPTURE_URL to the page to capture.}"
: "${CAPTURE_DIR:?Set CAPTURE_DIR to the evidence output directory.}"

PROJECT_DIR="$(cd "${PROJECT_DIR:-$(dirname "${BASH_SOURCE[0]}")}" && pwd)"
RUNTIME_DIR="${RUNTIME_DIR:-/home/runner/work/_temp/omgithub-runtime}"
PLAYWRIGHT_DIR="${PLAYWRIGHT_DIR:-$HOME/.local/share/omgithub-playwright}"
CAPTURE_SCRIPT="$RUNTIME_DIR/scripts/default-capture.mjs"

run mkdir -p "$CAPTURE_DIR"
run rm -f "$CAPTURE_DIR/final-desktop.png" "$CAPTURE_DIR/final-mobile.png"

# Missing browser infrastructure is temporary, not a defect in this script.
if [[ ! -f "$CAPTURE_SCRIPT" ]]; then
  echo "Capture runtime is missing: $CAPTURE_SCRIPT" >&2
  exit 75
fi
if [[ ! -d "$PLAYWRIGHT_DIR/node_modules/playwright" ]] || [[ ! -d "$PLAYWRIGHT_DIR/node_modules/playwright-core" ]]; then
  echo "Playwright browser runtime is missing: $PLAYWRIGHT_DIR" >&2
  exit 75
fi

export CAPTURE_STRICT="${CAPTURE_STRICT:-1}"
run node "$CAPTURE_SCRIPT"
status=$?

if [[ "$status" -eq 75 ]]; then
  echo "Capture failed due to a temporary navigation or browser failure." >&2
  exit 75
fi
if [[ "$status" -ne 0 ]]; then
  echo "Capture failed with exit code $status." >&2
  exit 1
fi

for name in desktop mobile; do
  file="$CAPTURE_DIR/final-$name.png"
  if [[ ! -s "$file" ]]; then
    echo "Capture did not produce $file" >&2
    exit 1
  fi
  run test -s "$file"
done

echo "Captured desktop and mobile views in $CAPTURE_DIR" >&2
exit 0
