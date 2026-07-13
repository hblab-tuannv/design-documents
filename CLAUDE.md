# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Package manager is pnpm. There is no test suite.

- `pnpm dev` — dev server at http://localhost:3000
- `pnpm build` — static export to `out/` (Next.js `output: 'export'`)
- `pnpm start` — serves the built `out/` directory (`serve out`)
- `pnpm lint` — Biome check (lint + format)
- `pnpm format` — Biome format --write
- `pnpm types:check` — regenerates `.source/`, runs `next typegen`, then `tsc --noEmit`

If imports from `collections/*` fail, the generated `.source/` directory is stale or missing — run `pnpm exec fumadocs-mdx` (also runs on postinstall).

A PostToolUse hook (`.claude/hooks/post-edit.sh`) automatically runs `biome check --write` on every edited file and `tsc --noEmit` after TypeScript edits. Do not manually re-run formatting after edits; fix any errors the hook reports back.

## Architecture

Fumadocs documentation site on Next.js App Router (React 19), fully statically exported.

### Content pipeline

`docs/*.mdx` → `source.config.ts` (`defineDocs` with `includeProcessedMarkdown: true`) → generated `.source/` (aliased as `collections/*` in tsconfig) → `lib/source.ts` (fumadocs `loader()` exporting `source`) → consumed by all routes.

- New doc page: add `docs/*.mdx` with `title`/`description` frontmatter.
- `lib/shared.ts` — site constants (`appName`, route prefixes, `gitConfig` for GitHub edit links).
- `lib/layout.shared.tsx` — layout options shared by `app/(home)` and `app/docs` layouts.

### Static export constraints

`next.config.mjs` sets `output: 'export'`, so every route must be statically renderable:

- Search: `app/api/search/route.ts` uses fumadocs `staticGET` to emit a prebuilt Orama index at build time; `components/search.tsx` runs the search fully client-side via `oramaStaticClient`.
- Dynamic routes (`app/og/docs/[...slug]`, `app/llms.mdx/docs/[[...slug]]`) must declare `generateStaticParams` and `revalidate = false`.
- LLM-facing outputs are per-language to keep AI context small: `/{lang}/llms.txt`, `/{lang}/llms-full.txt`, and per-page raw markdown at `/llms.mdx/docs/{lang}/...` (fed by `getLLMText` / processed markdown from `lib/source.ts`). Copyable links live in the sidebar via `components/ai-links.tsx`.

### MDX rendering

`components/mdx.tsx` registers global MDX components. Markdown `table` is mapped to `components/data-table.tsx`, which parses each table's static `<thead>/<tbody>` React children at runtime and re-renders them as an interactive TanStack Table (sorting, global filter, column visibility, pagination). Plain tables in `docs/` therefore become interactive automatically.

### UI components — Base UI, not Radix

- `fumadocs-ui` resolves to `npm:@fumadocs/base-ui`, and shadcn uses the `base-nova` style on `@base-ui/react`. Component APIs differ from Radix-based shadcn — e.g. triggers take a `render` prop instead of `asChild`.
- `components/ui/*` is shadcn-generated code: excluded from Biome and from the post-edit hook. Add components via `pnpm exec shadcn add <name>` (a shadcn MCP server is configured in `.mcp.json`).

## Code style

Enforced by Biome (`biome.json`): single quotes, no semicolons (`asNeeded`), 2-space indent, 80-column lines, sorted Tailwind classes inside `cn`/`clsx`, organized imports. Tailwind CSS 4 — configuration lives in CSS (`app/global.css`); there is no tailwind.config file.
