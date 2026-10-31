#!/usr/bin/env bash
# Capture desktop and mobile screenshots of CAPTURE_URL into CAPTURE_DIR.
# Exit 75 for temporary browser/navigation infrastructure failures, 1 for defects.
set -uo pipefail
cd "$(dirname "$0")" || exit 1

: "${CAPTURE_URL:?Set CAPTURE_URL to the preview URL.}"
: "${CAPTURE_DIR:?Set CAPTURE_DIR to an output directory outside the source tree.}"
RUNTIME_DIR="${RUNTIME_DIR:-/home/runner/work/_temp/omgithub-runtime}"

export CAPTURE_READY_SELECTOR="${CAPTURE_READY_SELECTOR:-#oyun}"
export CAPTURE_AUTO_START="${CAPTURE_AUTO_START:-false}"

t() {
  /usr/bin/time -p "$@"
}

t mkdir -p "$CAPTURE_DIR"

t node "$RUNTIME_DIR/scripts/default-capture.mjs"
status=$?

if [[ "$status" -ne 0 ]]; then
  echo "Capture failed with exit code $status." >&2
  exit "$status"
fi

for view in desktop mobile; do
  t test -s "$CAPTURE_DIR/final-$view.png" || {
    echo "Missing or empty screenshot: final-$view.png" >&2
    exit 1
  }
done

echo "Captured: $CAPTURE_DIR/final-desktop.png, $CAPTURE_DIR/final-mobile.png"
