#!/usr/bin/env bash
# Step 2 — collect raw git/GitHub signals + shallow-clone every repo listed in
# analysis/.work/repo-list.json. Requires an authenticated `gh` and `jq`.
# Run from anywhere: bash analysis/tools/batch-collect.sh
set -uo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
WORK="$ROOT/analysis/.work"
LIST="$WORK/repo-list.json"
SIGDIR="$WORK/signals"
REPODIR="$WORK/repos"
mkdir -p "$SIGDIR" "$REPODIR"

if [[ ! -f "$LIST" ]]; then
  echo "missing $LIST — run: bun run analysis/tools/extract-repos.ts" >&2
  exit 1
fi

COUNT="$(jq length "$LIST")"
echo "Collecting signals for $COUNT repos..."
for i in $(seq 0 $((COUNT - 1))); do
  SLUG="$(jq -r ".[$i].slug" "$LIST")"
  URL="$(jq -r ".[$i].repo_url" "$LIST")"
  echo "[$((i + 1))/$COUNT] $SLUG -> $URL"
  bash "$SCRIPT_DIR/collect-signals.sh" "$URL" "$REPODIR" >"$SIGDIR/$SLUG.json" 2>/dev/null ||
    echo "{\"slug\":\"$SLUG\",\"url\":\"$URL\",\"accessible\":false,\"reason\":\"collector error\"}" >"$SIGDIR/$SLUG.json"
  tmp="$(jq --arg ps "$SLUG" '. + {project_slug: $ps}' "$SIGDIR/$SLUG.json" 2>/dev/null)" &&
    echo "$tmp" >"$SIGDIR/$SLUG.json"
done

echo "DONE. Signals in $SIGDIR"
echo "--- accessibility summary ---"
for f in "$SIGDIR"/*.json; do
  jq -r '"\(.project_slug // "?")\t accessible=\(.accessible)\t cloned=\(.cloned // "n/a")\t loc=\(.code_loc // "?")\t commits=\(.commit_count // "?")"' "$f"
done
