#!/usr/bin/env bash
# Build the static site and serve it in the foreground on PORT (default 3000).
set -euo pipefail
cd "$(dirname "$0")"

PORT="${PORT:-3000}"
export PORT
WEB_DIR="${OPENCODE_WEB_DIR:-/home/runner/work/_temp/omgithub-web}"
DEPLOYMENT_OUTPUT="$WEB_DIR/deployment-output.json"

t() {
  /usr/bin/time -p "$@"
}

t mkdir -p "$WEB_DIR"

# Install dependencies when a package.json is present.
if [[ -f package.json ]]; then
  if [[ -f package-lock.json ]]; then
    t npm ci --no-audit --no-fund --loglevel=error
  else
    t npm install --no-audit --no-fund --loglevel=error
  fi
fi

# Build the static deployment output inside the project.
if [[ -f package.json ]] && node -e "process.exit(require('./package.json').scripts?.build ? 0 : 1)"; then
  t npm run build --silent
elif [[ ! -f dist/index.html ]]; then
  echo "No build script and no dist/index.html to serve." >&2
  exit 1
fi

t test -f dist/index.html
t node scripts/write-deployment.mjs "$DEPLOYMENT_OUTPUT" "$PWD" "$PWD/dist"

echo "Starting preview on http://0.0.0.0:$PORT"
t node scripts/serve.mjs
