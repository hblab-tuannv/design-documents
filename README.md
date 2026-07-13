# design-documents

Internal documentation site, available in 3 languages: **Vietnamese** (default), Japanese, English.

## Requirements

- Node.js and [pnpm](https://pnpm.io)

## Run the dev server

```bash
pnpm install
pnpm dev
```

Open <http://localhost:3000> — it redirects to `/vi`.

To share the docs with teammates on your LAN, copy `.env.example` to
`.env.local`, set `ALLOWED_DEV_ORIGINS` to your machine's IP, and give them
`http://<your-ip>:3000`.

## Build for production

```bash
pnpm build
```

The output is a static site in the `out/` directory, deployable to any static hosting (Nginx, S3, GitHub Pages…). Preview the build locally:

```bash
pnpm start
```

## Add documents

Documents live in `docs/`, split by language:

```txt
docs/
├── vi/   ← Vietnamese
├── ja/   ← Japanese
└── en/   ← English
```

Just create a `.md` file in the matching language folder, starting with `title` and `description` frontmatter:

```md
---
title: Document title
description: Short description
---

Write the content in plain Markdown.
```

Save the file and the page appears in the menu right away (the dev server hot-reloads). A few conveniences:

- **Markdown tables** automatically become interactive tables (sorting, search, pagination).
- **Mermaid diagrams**: write a code block with the `mermaid` language and it renders as a diagram.
- Create subfolders inside `docs/<language>/` to group documents into sections.
