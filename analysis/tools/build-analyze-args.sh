#!/usr/bin/env bash
# Step 3a — build the args array for the analyze workflow from collected signals
# (only repos that cloned successfully). Prints JSON to stdout AND saves it to
# analysis/.work/analyze-args.json. Pass this array as the Workflow `args`.
# Run: bash analysis/tools/build-analyze-args.sh
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
WORK="$ROOT/analysis/.work"
OUT="$WORK/analyze-args.json"

# s = project slug, c = absolute clone path, g = absolute signals file path
jq -s --arg work "$WORK" '[.[] | select(.cloned == true) | {
  s: .project_slug,
  c: .clone_path,
  g: ($work + "/signals/" + .project_slug + ".json")
}]' "$WORK"/signals/*.json | tee "$OUT"
