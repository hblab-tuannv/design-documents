#!/usr/bin/env bash
# PostToolUse hook: run Biome (format + lint --write) on the edited file,
# then type-check the project if the file is TypeScript.
# Exit 2 => stderr is fed back to Claude so it can fix the errors.
set -u

file=$(jq -r '.tool_input.file_path // empty')
[ -z "$file" ] && exit 0

# Skip shadcn-generated code (already excluded in biome.json)
case "$file" in
  */components/ui/* | */.source/* | */.next/*) exit 0 ;;
esac

cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0

case "$file" in
  *.ts | *.tsx | *.js | *.jsx | *.mjs | *.json | *.css | *.md | *.mdx)
    biome_out=$(pnpm biome check --write --no-errors-on-unmatched "$file" 2>&1)
    if [ $? -ne 0 ]; then
      echo "Biome found unfixable issues in $file:" >&2
      echo "$biome_out" >&2
      exit 2
    fi
    ;;
  *) exit 0 ;;
esac

case "$file" in
  *.ts | *.tsx)
    tsc_out=$(pnpm tsc --noEmit 2>&1)
    if [ $? -ne 0 ]; then
      echo "TypeScript check failed after editing $file:" >&2
      echo "$tsc_out" >&2
      exit 2
    fi
    ;;
esac

exit 0
