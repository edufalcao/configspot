# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Configspot is a config-aware comparison and validation tool for developers. It compares config files (.env, JSON, YAML, TOML, INI) with semantic understanding — detecting meaningful changes, risky modifications, and secret exposure beyond plain text diffs. Sibling product to [diffspot](https://github.com/edufalcao/diffspot), sharing the same tech stack and design language.

Full product spec: `docs/plans/CONFIGSPOT_PLAN.md`

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Nuxt 4 (Vue 3 + TypeScript) |
| Styling | Tailwind CSS 4 (via `@tailwindcss/vite`) |
| Code editors | CodeMirror 6 via `vue-codemirror` |
| Diff engine | jsdiff (`diff`) |
| Parsing | `js-yaml`, `toml`, `ini`, custom `.env` parser |
| Icons | Lucide Vue Next |
| Fonts | @nuxtjs/google-fonts |
| Runtime | Cloudflare Workers (`nitro.preset = 'cloudflare-pages'`) |
| Database | Cloudflare D1 (SQLite) via Drizzle ORM |
| Testing | Vitest |
| Linting | ESLint 10 |

## Commands

```bash
pnpm dev            # Start dev server
pnpm build          # Build for production (outputs to dist/)
pnpm preview        # Preview production build
pnpm test:packages  # Run package tests
pnpm lint           # Run ESLint
pnpm typecheck      # Run Nuxt typecheck
pnpm build:packages # Build packages in parallel
```

## Verification

Run this checklist before considering any implementation task complete:

```bash
pnpm test:packages
pnpm lint
pnpm typecheck
pnpm build
```

If any step cannot run or fails for an external reason, call that out explicitly.

## Design System

Inherited from diffspot and edufalcao.com — dark terminal-chic aesthetic:

- **Dark mode default** — Background: `#0d0d0d`, Surface: `#1a1a1a`, Elevated: `#242424`
- **Light mode** — Background: `#fafafa`, Surface: `#ffffff`, Elevated: `#f0f0f0`
- **Accent colors** — Cyan: `#00e5cc` (dark) / `#00b39e` (light), Pink: `#ff006e` (dark) / `#e0005f` (light)
- **Fonts** — Space Grotesk (headings), DM Sans (body), JetBrains Mono (code/editors/badges)
- **Effects** — Noise overlay (0.015 opacity), radial gradient background, glow on hover, fade-in/slide-up animations
- **Design tokens** — Defined via `@theme` blocks in the main CSS file (Tailwind 4 CSS-first approach)

## Architecture

### Source Structure

```
app/
├── components/
│   ├── compare/       # Input workspace, editor panels, format selector
│   ├── results/       # Diff view, summary bar, risk sidebar, export
│   ├── layout/        # Header, footer, page shell
│   └── ui/            # Buttons, panels, badges, inputs, surfaces
├── composables/       # Shared reactive logic (useCompare, useExport, useKeyboard)
├── types/             # TypeScript interfaces (ConfigTree, DiffResult, RiskAnnotation)
├── utils/
│   ├── parsers/       # Format detection + per-format parsers
│   ├── diff/          # Raw diff, semantic diff, smart summary
│   └── risk/          # Risk classifier, secret detection, severity scoring
├── workers/           # Web Workers for off-main-thread computation
├── pages/             # File-based routing
└── assets/css/        # Tailwind 4 entry, @theme tokens

server/
├── api/               # Nitro API routes
├── database/
│   ├── schema.ts      # Drizzle schema
│   └── migrations/    # SQL migrations
└── utils/             # Server helpers (nanoid, D1 client)
```

### Key Data Flow

Parsers (`app/utils/parsers/`) → normalized `ConfigTree` → Diff engine (`app/utils/diff/`) → `DiffResult` → Risk engine (`app/utils/risk/`) → annotated results → UI components

### API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/share` | POST | Save comparison to D1, return short ID + delete token |
| `/api/share/[id]` | GET | Retrieve comparison, increment view count |
| `/api/share/[id]` | DELETE | Delete comparison (requires delete token) |

### Database

D1 binding configured in `wrangler.toml` (variable: `DB`). Migrations in `server/database/migrations/`.

**Local development:**
```bash
# Run migrations against local D1
npx wrangler d1 execute configspot --local --file=./server/database/migrations/0001_create_comparisons.sql

# Start dev server (nitro-cloudflare-dev provides local D1 bindings automatically)
pnpm dev
```

**Production setup (one-time):**
```bash
# 1. Create the D1 database
npx wrangler d1 create configspot
# Update database_id in wrangler.toml with the returned ID

# 2. Run migrations against remote
npx wrangler d1 execute configspot --remote --file=./server/database/migrations/0001_create_comparisons.sql

# 3. Bind D1 to Pages project (Cloudflare dashboard or CLI)
npx wrangler pages project edit configspot --d1 DB=configspot
# Or: Dashboard → Pages → configspot → Settings → Functions → D1 database bindings
# Variable name: DB, D1 database: configspot
```

**Future migrations:** add a new `.sql` file in `server/database/migrations/`, run with `--local` for dev and `--remote` before deploying.

## Conventions

- TypeScript strict mode throughout
- Composition API with `<script setup>` syntax
- Tailwind utility classes; design tokens via CSS variables
- Components: PascalCase (e.g., `DiffEditor.vue`)
- Composables: `use*` naming (e.g., `useCompare.ts`)
- Server routes: `<name>.<method>.ts` (e.g., `share.post.ts`)
- Migrations: `NNNN_description.sql` (e.g., `0001_create_comparisons.sql`)
- Pure computation in `app/utils/` — no Vue/DOM imports (must be Web Worker compatible)
- Web Workers in `app/workers/`, bundled via `new URL('../workers/<name>.ts', import.meta.url)`

## Multi-Agent Strategy

Independent workstreams should use isolated worktrees. Interface contracts (types in `app/types/`) must be defined before parallel agents start. Each agent writes unit tests alongside code. See `docs/plans/CONFIGSPOT_PLAN.md` §17 for the full agent coordination plan.

## Deployment

```bash
pnpm build
wrangler pages deploy dist --project-name=configspot
```

Output: `dist/_worker.js` (Cloudflare Worker), `dist/_nuxt/` (static assets), `dist/index.html` (SPA shell).
