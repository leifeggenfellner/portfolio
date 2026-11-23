#!/usr/bin/env bash
# Regenerates the visual-regression baselines (tests/e2e/__screenshots__) in
# the official Playwright container, which renders like CI's Ubuntu runners;
# baselines taken on another OS differ by a few percent in font rendering.
# Needs docker (or podman) and a fresh `pnpm build`.
set -euo pipefail
cd "$(dirname "$0")/.."

version=$(node -p 'require("@playwright/test/package.json").version')
pnpm preview --port 4321 >/dev/null 2>&1 &
preview=$!
trap 'kill $preview' EXIT
until curl -sf http://localhost:4321/ >/dev/null; do sleep 0.5; done

# The suite reuses the preview above (reuseExistingServer when not in CI).
docker run --rm --network host --ipc host --user "$(id -u):$(id -g)" -e HOME=/tmp -e VISUAL=1 \
  -v "$PWD":/work -w /work \
  "mcr.microsoft.com/playwright:v${version}-noble" \
  node node_modules/@playwright/test/cli.js test --project=visual --update-snapshots --reporter=line
