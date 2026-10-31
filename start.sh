#!/usr/bin/env bash
# Build the static deployment and serve it in the foreground on PORT.
set -euo pipefail

run() {
  echo "+ $*" >&2
  /usr/bin/time -p "$@"
}

PROJECT_DIR="$(cd "${PROJECT_DIR:-$(dirname "${BASH_SOURCE[0]}")}" && pwd)"
cd "$PROJECT_DIR"

PORT="${PORT:-3000}"
[[ "$PORT" =~ ^[1-9][0-9]*$ ]] || { echo "PORT must be a positive integer, got: $PORT" >&2; exit 1; }

WEB_DIR="${OPENCODE_WEB_DIR:-/home/runner/work/_temp/omgithub-web}"
DIST="$PROJECT_DIR/dist"
DEPLOY_FILE="$WEB_DIR/deployment-output.json"

run mkdir -p "$WEB_DIR"
run mkdir -p "$DIST"

# Install dependencies and run a project build when one is defined.
if [[ -f "$PROJECT_DIR/package.json" ]]; then
  if [[ -f "$PROJECT_DIR/package-lock.json" ]]; then
    run npm ci --no-audit --no-fund
  else
    run npm install --no-audit --no-fund
  fi
  if run node -e 'const p = require("./package.json"); process.exit(p.scripts && p.scripts.build ? 0 : 1)'; then
    run npm run build
  else
    run node -e 'console.log("No package build script; using the static builder.")'
  fi
fi

# Rebuild only when the build script or source assets are newer than the output.
needs_build=false
if [[ ! -f "$DIST/index.html" ]]; then
  needs_build=true
elif [[ "$PROJECT_DIR/build-static.mjs" -nt "$DIST/index.html" ]]; then
  needs_build=true
elif [[ -d "$PROJECT_DIR/web" ]] && [[ -n "$(find "$PROJECT_DIR/web" -type f -newer "$DIST/index.html" -print -quit)" ]]; then
  needs_build=true
fi

if [[ "$needs_build" == true ]]; then
  if [[ -d "$PROJECT_DIR/web" ]]; then
    run rm -rf "$DIST"
    run mkdir -p "$DIST"
    run cp -R "$PROJECT_DIR/web/." "$DIST/"
    if [[ ! -f "$DIST/index.html" ]]; then
      run node "$PROJECT_DIR/build-static.mjs" "$DIST"
    fi
  else
    run node "$PROJECT_DIR/build-static.mjs" "$DIST"
  fi
else
  echo "Static output is up to date: $DIST" >&2
fi

[[ -f "$DIST/index.html" ]] || { echo "Build did not produce $DIST/index.html" >&2; exit 1; }

run node -e 'const fs = require("fs"); const [out, project, directory] = process.argv.slice(1); fs.writeFileSync(out, JSON.stringify({ project, directory }) + "\n")' \
  "$DEPLOY_FILE" "$PROJECT_DIR" "$DIST"
run test -s "$DEPLOY_FILE"
echo "Deployment metadata: $DEPLOY_FILE" >&2

# Serve the built static directory in the foreground.
run python3 -m http.server "$PORT" --bind 0.0.0.0 --directory "$DIST"
