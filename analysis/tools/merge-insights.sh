#!/usr/bin/env bash
# Step 4 — merge analysis + signals + project metadata (+ evaluation, if present)
# into the committed insights.json and per-project files.
#   - reads  analysis/.work/analysis-raw.json   (required; the analyze workflow result)
#   - reads  analysis/.work/project-meta.json   (required)
#   - reads  analysis/.work/signals/*.json      (required)
#   - reads  analysis/.work/eval-raw.json        (optional; the evaluate workflow result)
#   - writes analysis/insights.json + analysis/insights/<slug>.json
# Run once after the analyze workflow (to produce insight files for eval args),
# then again after the evaluate workflow.
# Run: bash analysis/tools/merge-insights.sh
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
WORK="$ROOT/analysis/.work"
ANALYSIS="$WORK/analysis-raw.json"
META="$WORK/project-meta.json"
EVAL="$WORK/eval-raw.json"
SIGDIR="$WORK/signals"
OUTDIR="$ROOT/analysis/insights"
OUTJSON="$ROOT/analysis/insights.json"
mkdir -p "$OUTDIR"

[[ -f "$ANALYSIS" ]] || { echo "missing $ANALYSIS (analyze workflow result)" >&2; exit 1; }
[[ -f "$META" ]] || { echo "missing $META (run export-meta.ts)" >&2; exit 1; }

# join analysis + meta (hyphen-insensitive slug match, e.g. aid-trace <-> aidtrace)
jq -n --slurpfile analysis "$ANALYSIS" --slurpfile meta "$META" '
  ($analysis[0]) as $a | ($meta[0]) as $m
  | def norm: gsub("-";"");
    [ $a[] | . as $row | ($row.project_slug) as $ps
      | (first($m[] | select((.slug == $ps) or ((.slug|norm) == ($ps|norm))))) as $pm
      | {
          project_slug: $ps,
          name: ($pm.name // $ps),
          repo_url: null,
          live_url: $pm.projectUrl,
          video_url: $pm.videoUrl,
          countries: $pm.countries,
          db_description: $pm.descriptionMarkdown,
          lifecycle_status: $pm.lifecycleStatus,
          analysis: $row.analysis
        } ]
' > "$OUTJSON"

# attach signals + repo_url per project
for f in "$SIGDIR"/*.json; do
  ps="$(jq -r '.project_slug' "$f")"
  repo="$(jq -r '.url // empty' "$f")"
  sig="$(jq '{accessible, stars, forks, contributors, commit_count, code_loc, created_at, pushed_at, license, languages_bytes, archived}' "$f" 2>/dev/null || echo '{}')"
  tmp="$(jq --arg ps "$ps" --arg repo "$repo" --argjson sig "$sig" \
    '(.[] | select(.project_slug==$ps) | .repo_url) |= $repo
     | (.[] | select(.project_slug==$ps) | .signals) |= $sig' "$OUTJSON")"
  echo "$tmp" > "$OUTJSON"
done

# merge evaluation if present
if [[ -f "$EVAL" ]]; then
  tmp="$(jq -n --slurpfile ins "$OUTJSON" --slurpfile ev "$EVAL" '
    ($ev[0]) as $e
    | [ $ins[0][] | . as $row | ($row.project_slug) as $ps
        | ($e[] | select(.project_slug==$ps) | .evaluation) as $eval
        | $row + {evaluation: $eval} ]')"
  echo "$tmp" > "$OUTJSON"
  echo "merged evaluation"
else
  echo "no eval-raw.json yet — evaluation left null"
fi

# write per-project files
rm -f "$OUTDIR"/*.json
jq -c '.[]' "$OUTJSON" | while read -r line; do
  ps="$(echo "$line" | jq -r '.project_slug')"
  echo "$line" | jq '.' > "$OUTDIR/$ps.json"
done

echo "wrote $(jq length "$OUTJSON") insights to analysis/insights.json + analysis/insights/"
