#!/usr/bin/env bash
# Usage: collect-signals.sh <github_url> <workdir>
# Emits raw repo signals as JSON to stdout. Shallow-clones into <workdir>/<repo>.
# NB: no `-e`/`pipefail` — `find … | head` legitimately triggers SIGPIPE (141)
# on large repos, which would otherwise kill the script mid-run. Each step has
# its own fallback instead.
set -u

RAW_URL="$1"
WORKDIR="$2"

# Normalize: strip trailing .git, query, fragment, trailing slash
URL="${RAW_URL%%#*}"
URL="${URL%%\?*}"
URL="${URL%.git}"
URL="${URL%/}"

# Extract owner/repo from github.com/owner/repo(/...)
PATH_PART="${URL#*github.com/}"
OWNER="$(echo "$PATH_PART" | cut -d/ -f1)"
REPO="$(echo "$PATH_PART" | cut -d/ -f2)"

if [[ -z "$OWNER" || -z "$REPO" ]]; then
  echo "{\"error\":\"could not parse owner/repo from $RAW_URL\"}"
  exit 0
fi

SLUG="$OWNER/$REPO"
DEST="$WORKDIR/${OWNER}__${REPO}"

# --- GitHub API metadata (graceful if repo is a user profile / 404 / private) ---
META="$(gh api "repos/$SLUG" 2>/dev/null || echo '{}')"
if [[ "$(echo "$META" | jq -r '.message // empty')" == "Not Found" || "$META" == "{}" ]]; then
  echo "{\"slug\":\"$SLUG\",\"url\":\"$URL\",\"accessible\":false,\"reason\":\"repo not found / private / not a repo\"}"
  exit 0
fi

LANGS="$(gh api "repos/$SLUG/languages" 2>/dev/null || echo '{}')"
CONTRIBUTORS="$(gh api "repos/$SLUG/contributors?per_page=100" 2>/dev/null | jq 'length' 2>/dev/null || echo 0)"
COMMIT_COUNT="$(gh api "repos/$SLUG/commits?per_page=1" -i 2>/dev/null | grep -i '^link:' | sed -n 's/.*[?&]page=\([0-9]*\)>; rel="last".*/\1/p' || echo "")"
[[ -z "$COMMIT_COUNT" ]] && COMMIT_COUNT=1

# --- Shallow clone for code inspection ---
rm -rf "$DEST"
CLONE_OK=true
git clone --depth 50 --quiet "https://github.com/$SLUG.git" "$DEST" 2>/dev/null || CLONE_OK=false

FILE_TREE="[]"
ROOT_FILES="[]"
LOC=0
if [[ "$CLONE_OK" == true ]]; then
  ROOT_FILES="$(ls -A "$DEST" 2>/dev/null | jq -R . | jq -s . )"
  # top 200 paths, skipping vendored/build dirs
  FILE_TREE="$(cd "$DEST" && find . -type f \
    -not -path '*/node_modules/*' -not -path '*/.git/*' -not -path '*/dist/*' \
    -not -path '*/build/*' -not -path '*/.next/*' -not -path '*/vendor/*' \
    2>/dev/null | head -200 | sed 's|^\./||' | jq -R . | jq -s .)"
  LOC="$(cd "$DEST" && find . -type f \( -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.jsx' -o -name '*.py' -o -name '*.go' -o -name '*.rb' -o -name '*.php' -o -name '*.java' -o -name '*.rs' -o -name '*.swift' -o -name '*.kt' -o -name '*.dart' -o -name '*.vue' -o -name '*.svelte' \) -not -path '*/node_modules/*' -not -path '*/.git/*' 2>/dev/null | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}' || echo 0)"
  [[ -z "$LOC" ]] && LOC=0
fi

jq -n \
  --arg slug "$SLUG" \
  --arg url "$URL" \
  --arg dest "$DEST" \
  --argjson meta "$META" \
  --argjson langs "$LANGS" \
  --argjson contributors "$CONTRIBUTORS" \
  --argjson commit_count "$COMMIT_COUNT" \
  --argjson loc "$LOC" \
  --argjson root_files "$ROOT_FILES" \
  --argjson file_tree "$FILE_TREE" \
  --argjson clone_ok "$CLONE_OK" \
  '{
    slug: $slug,
    url: $url,
    accessible: true,
    clone_path: $dest,
    cloned: $clone_ok,
    stars: $meta.stargazers_count,
    forks: $meta.forks_count,
    open_issues: $meta.open_issues_count,
    created_at: $meta.created_at,
    pushed_at: $meta.pushed_at,
    default_branch: $meta.default_branch,
    archived: $meta.archived,
    description: $meta.description,
    homepage: $meta.homepage,
    license: ($meta.license.spdx_id // null),
    topics: ($meta.topics // []),
    size_kb: $meta.size,
    languages_bytes: $langs,
    contributors: $contributors,
    commit_count: $commit_count,
    code_loc: $loc,
    root_files: $root_files,
    file_tree_sample: $file_tree
  }'
