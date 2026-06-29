#!/usr/bin/env bash
# Step 5a — build the args array for the evaluate workflow from the merged
# insights (run merge-insights.sh first so per-project files exist). Prints JSON
# to stdout AND saves to analysis/.work/eval-args.json. Pass as Workflow `args`.
# Run: bash analysis/tools/build-eval-args.sh
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
WORK="$ROOT/analysis/.work"
INS="$ROOT/analysis/insights.json"
OUT="$WORK/eval-args.json"

# s = slug, p = absolute path to per-project insight file, u = live url, v = video
jq --arg dir "$ROOT/analysis/insights" '[.[] | {
  s: .project_slug,
  p: ($dir + "/" + .project_slug + ".json"),
  u: .live_url,
  v: .video_url
}]' "$INS" | tee "$OUT"
