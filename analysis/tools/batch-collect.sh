#!/usr/bin/env bash
# Collect signals for every repo in repo-list.json
set -uo pipefail
BASE="/private/tmp/claude-501/-Users-cris-hackathons-build4venezuela/c6d977e4-7593-4b2c-b5f2-c0389c649767/scratchpad"
LIST="$BASE/repo-list.json"
SIGDIR="$BASE/signals"
REPODIR="$BASE/repos"
mkdir -p "$SIGDIR" "$REPODIR"

COUNT="$(jq length "$LIST")"
echo "Collecting signals for $COUNT repos..."

for i in $(seq 0 $((COUNT - 1))); do
  SLUG="$(jq -r ".[$i].slug" "$LIST")"
  URL="$(jq -r ".[$i].repo_url" "$LIST")"
  echo "[$((i+1))/$COUNT] $SLUG -> $URL"
  bash "$BASE/collect-signals.sh" "$URL" "$REPODIR" > "$SIGDIR/$SLUG.json" 2>/dev/null \
    || echo "{\"slug\":\"$SLUG\",\"url\":\"$URL\",\"accessible\":false,\"reason\":\"collector error\"}" > "$SIGDIR/$SLUG.json"
  # annotate with project slug for later join
  tmp="$(jq --arg ps "$SLUG" '. + {project_slug: $ps}' "$SIGDIR/$SLUG.json" 2>/dev/null)" \
    && echo "$tmp" > "$SIGDIR/$SLUG.json"
done

echo "DONE. Signals in $SIGDIR"
echo "--- accessibility summary ---"
for f in "$SIGDIR"/*.json; do
  jq -r '"\(.project_slug // "?")\t accessible=\(.accessible)\t cloned=\(.cloned // "n/a")\t loc=\(.code_loc // "?")\t commits=\(.commit_count // "?")"' "$f"
done
