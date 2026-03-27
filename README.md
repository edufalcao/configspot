# configspot

Config comparison and validation tool for developers. Compare `.env`, JSON, YAML, TOML, and INI files with semantic diffs, risk detection, and secret masking.

Built with a dark terminal-chic aesthetic inspired by [edufalcao.com](https://edufalcao.com).

**Live:** [configspot.edufalcao.com](https://configspot.edufalcao.com)

## Features

- Semantic config comparison (not just text diff)
- Supports `.env`, JSON, YAML, TOML, and INI formats
- Auto-detect config format
- Risk detection for dangerous changes
- Secret masking and exposure warnings
- Smart summary of meaningful changes
- Shareable comparisons via short URLs
- Drag-and-drop file upload
- Dark/light theme toggle
- Keyboard shortcuts

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Nuxt 4 (Vue 3 + TypeScript) |
| Styling | Tailwind CSS 4 |
| Code editors | CodeMirror 6 via `vue-codemirror` |
| Diff engine | jsdiff (`diff`) |
| Parsing | `js-yaml`, `smol-toml`, `ini`, custom `.env` parser |
| Icons | Lucide Vue Next |
| Fonts | Space Grotesk, DM Sans, JetBrains Mono |
| Runtime | Cloudflare Workers (via `cloudflare-pages` preset) |
| Database | Cloudflare D1 (SQLite) via Drizzle ORM |
| Testing | Vitest |

## Getting Started

```bash
pnpm install

# Set up local D1 database
npx wrangler d1 execute configspot --local --file=./server/database/migrations/0001_create_comparisons.sql

# Start dev server
pnpm dev
```

## Build & Deploy

```bash
pnpm build
```

Output is in `dist/` — deployed to Cloudflare Pages via `wrangler pages deploy dist --project-name=configspot`.

## Database Migrations

```bash
# Run against remote D1
npx wrangler d1 execute configspot --remote --file=./server/database/migrations/0001_create_comparisons.sql

# Run locally
npx wrangler d1 execute configspot --local --file=./server/database/migrations/0001_create_comparisons.sql
```

Ensure the D1 database binding is configured in Cloudflare Pages:
- Variable name: `DB`
- D1 database: `configspot`

## Verification

```bash
pnpm test:packages
pnpm lint
pnpm typecheck
pnpm build
```

## Project Structure

```
app/
├── components/
│   ├── compare/       # Input workspace, editor panels, format selector
│   ├── results/       # Diff view, summary bar, risk sidebar, export
│   ├── layout/        # AppHeader, AppFooter
│   └── ui/            # Buttons, panels, badges, inputs, surfaces
├── composables/       # Shared reactive logic (useCompare, useExport, useKeyboard)
├── types/             # TypeScript interfaces
├── utils/
│   ├── parsers/       # Format detection + per-format parsers
│   ├── diff/          # Raw diff, semantic diff, smart summary
│   └── risk/          # Risk classifier, secret detection, severity scoring
├── workers/           # Web Workers for off-main-thread computation
├── pages/             # File-based routing
└── assets/css/        # Design system (CSS variables, animations)
server/
├── api/               # Nitro API routes
├── database/          # Drizzle schema + SQL migrations
└── utils/             # Server helpers
docs/                  # Product spec
public/                # Static assets (favicon, og.png)
wrangler.toml          # Cloudflare Workers + D1 binding config
```
