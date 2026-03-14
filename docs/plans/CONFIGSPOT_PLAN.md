# Configspot Plan

> Last updated: 2026-03-14 (revised)

## 1. Product Summary

**Configspot** is a developer-focused config comparison and validation tool.

It helps developers compare two config files or snippets and answer questions that a plain text diff does not answer well:

- Which keys were added, removed, or changed?
- Are the differences only formatting and ordering, or actual behavior changes?
- Which changes are risky?
- Which environment variables are missing?
- Which config changes are safe to ignore?
- Is this config valid against a known schema?
- Can I share this comparison with my team without copy-pasting?

The product should feel like a natural sibling to `diffspot`, but aimed at structured configuration instead of generic text.

## 2. Product Positioning

### Core value proposition

Configspot is not just a diff viewer. It is a **config-aware reviewer**.

It should combine:

- raw diff visibility
- semantic understanding of common config formats
- risk-oriented summaries for faster review
- zero-friction shareability via short database-backed links

### Ideal users

- backend engineers
- frontend engineers
- DevOps / platform engineers
- engineers reviewing deployment changes
- teams comparing `dev`, `staging`, and `production` configuration

## 3. Design Direction

Configspot should inherit the visual language of:

- `edufalcao.com`
- `diffspot`

### Aesthetic goals

- dark terminal-chic base
- strong typography contrast
- cyan / pink accent system
- subtle noise texture and radial glow background
- mono accents for labels, chips, and technical metadata
- polished, productized developer-tool feel rather than dashboard boilerplate

### Visual rules

- Use **Space Grotesk** for display headings.
- Use **DM Sans** for body copy.
- Use **JetBrains Mono** for file names, keys, values, badges, and control labels.
- Reuse the glow, border, gradient, and surface treatment patterns already established in `diffspot`.
- Prefer focused panels and comparison surfaces over generic admin tables.

### Tone

- precise
- technical
- calm
- utility-first

## 4. Product Concept

### MVP concept

The first version should follow the same core interaction model as `diffspot`:

- left input: original config
- right input: updated config
- top controls: format, compare action, semantic filters
- result area: raw diff + smart summary
- sidebar: change summary and risk indicators

This is the lowest-risk path because it reuses the strongest ideas already validated in `diffspot`.

### What makes it different from Diffspot

Configspot should understand structure and intent:

- ignore key order when appropriate
- hide formatting-only changes
- detect missing required keys
- summarize changed values by path
- classify risky config changes
- validate configs against known schemas (e.g., `tsconfig.json`, `package.json`)
- detect template variables and interpolation patterns (`${VAR}`, `{{var}}`, `<%= var %>`)
- cross-format comparison (e.g., compare a `.env` against a `docker-compose.yml` to find missing env bindings)

## 5. Supported Formats

### MVP

- `.env`
- `json`
- `yaml` / `yml`
- `toml`
- `ini`

### Phase 2

- `package.json`
- `tsconfig.json`
- `docker-compose.yml`
- GitHub Actions workflow YAML
- Kubernetes manifests
- Helm values
- `Dockerfile` (label/env/arg comparison)
- `nginx.conf` (directive-level diff)
- `.prettierrc` / `.eslintrc` / `biome.json`

## 6. Core Features

### 6.1 Input and Parsing

- paste, type, drag-and-drop, and upload config files
- auto-detect format from content heuristics (not just extension)
- manual format override
- validate parseability before compare
- show parser errors inline with exact context
- load config directly from a URL (e.g., raw GitHub link)
- sample configs: preloaded examples for each format so users can try the tool instantly

### 6.2 Comparison Modes

- raw text diff
- semantic diff
- smart summary
- three-way comparison (base / left / right) for merge conflict resolution
- cross-format comparison (compare equivalent configs in different formats, e.g., JSON vs YAML)

### 6.3 Semantic Behaviors

- ignore ordering for object keys where order is not meaningful
- optionally ignore comments
- optionally ignore whitespace / formatting
- detect added keys
- detect removed keys
- detect changed values
- detect moved keys only when safe to infer

### 6.4 Risk and Review

- highlight risky changes
- detect likely secrets and redact/mask by default
- surface environment-critical changes:
  - URLs
  - ports
  - feature flags
  - credentials
  - dependency versions
  - service names

### 6.5 Output and Export

- export raw diff
- export semantic summary
- export HTML review report
- copy structured summary to clipboard
- generate shareable URL via D1-backed short links
- export as Markdown table (useful for PR descriptions and Slack)
- generate a "config migration checklist" — actionable list of what needs to change

### 6.6 Shareable URLs

One of the highest-value features for adoption: persist comparison state to a database and generate short, shareable links.

When a user clicks "Share", the app:

1. Saves both configs, detected format, and active filters to Cloudflare D1.
2. Returns a short ID (e.g., `configspot.com/s/a3xK9m`).
3. The recipient opens the link and sees the full comparison restored — both inputs, diff results, and filters.

This enables:

- sharing comparisons in Slack, PRs, and incident threads with clean short URLs
- bookmarking known comparisons for repeated use
- linking directly from documentation
- no URL length limits — configs of any size can be shared

#### Data model

Managed via Drizzle ORM with Cloudflare D1:

```
comparisons
├── id            TEXT PRIMARY KEY   (nanoid, e.g., "a3xK9m")
├── left_content  TEXT NOT NULL      (original config)
├── right_content TEXT NOT NULL      (updated config)
├── format        TEXT NOT NULL      (detected or overridden format)
├── filters       TEXT               (JSON-serialized active filters)
├── created_at    INTEGER NOT NULL   (Unix timestamp)
├── expires_at    INTEGER            (optional TTL for auto-cleanup)
└── view_count    INTEGER DEFAULT 0
```

#### Retention and privacy

- Shared comparisons should have a default TTL (e.g., 30 days) with an option to create permanent links.
- No authentication required to create or view a comparison.
- Configs may contain sensitive data — warn users before sharing, and never index shared comparisons for search engines (`noindex` on share pages).
- Provide a "delete this comparison" action on the share page (tied to a delete token stored in the creator's browser via `localStorage`).

## 7. UX Flow

1. User lands on the page.
2. User pastes or uploads two config files.
3. Configspot auto-detects format.
4. User clicks `Compare`.
5. App parses both configs.
6. If parsing fails, show inline parser errors and stop.
7. If parsing succeeds, show:
   - raw diff
   - semantic change summary
   - risky change section
8. User filters results:
   - hide formatting-only
   - ignore ordering
   - mask secrets
   - show only risky changes
9. User exports, shares findings, or generates a shareable URL.

### Instant demo flow

A "Try it" button on the hero should load a prebuilt comparison (e.g., a staging vs production `.env`) so first-time visitors see the value in under 5 seconds without pasting anything.

## 8. Information Architecture

### Primary page sections

- hero / product intro
- compare workspace
- result summary bar
- diff results
- risk summary sidebar
- export actions

### Result summary bar

Should show compact metrics such as:

- `+12 keys added`
- `-3 keys removed`
- `8 values changed`
- `2 risky changes`
- `format: yaml`

### Risk summary sidebar

Examples:

- `DATABASE_URL changed`
- `FEATURE_X enabled`
- `PORT changed 8080 -> 80`
- `Missing key: REDIS_URL`

## 9. MVP Scope

### In scope

- single-page app
- two-side compare workspace
- raw diff
- semantic summary for `.env`, JSON, YAML, TOML, and INI
- upload and paste flows
- parser error handling
- export summary and raw diff
- dark/light themes
- responsive layout
- shareable URLs via D1-backed short links
- preloaded sample comparisons ("Try it" demo)
- keyboard shortcuts for power users (navigate changes, toggle filters, copy results)

### Explicitly out of scope for MVP

- user accounts
- team collaboration
- persistent config history
- GitHub integration
- environment presets
- AI-generated remediation advice
- full tree explorer

## 10. Phase Roadmap

### Phase 0 — Foundation

- create repo structure
- establish design tokens and theme system
- build basic compare page shell
- configure CI, lint, typecheck, and build flow

### Phase 1 — MVP

- build format detection and parsing layer
- implement raw diff + semantic summary
- add file upload and validation
- ship export support
- deploy public first version

### Phase 2 — Structured Review

- add tree explorer for nested formats
- add path-based filtering
- add "show only risky changes"
- add package-specific heuristics for `package.json`, GitHub Actions, and Docker Compose
- three-way comparison mode
- cross-format comparison (JSON vs YAML, `.env` vs `docker-compose.yml` env bindings)
- config schema validation for well-known formats

### Phase 3 — Environment Workflows

- compare named environments
- save compare sessions
- share report links
- add validation rules per config type
- multi-file comparison (upload a directory of configs and compare across environments)
- config drift dashboard (pin a reference config and check variants against it)

### Phase 4 — Intelligence Layer

- optional AI-assisted change explanations
- remediation suggestions
- change review summaries for pull requests
- "explain this config" mode — describe what a single config does, not just diffs
- auto-suggest missing keys based on format conventions and common patterns

### Phase 5 — CLI and CI Integration

- `configspot` CLI companion (`npx configspot diff staging.env production.env`)
- CI check: fail a pipeline if config drift exceeds a threshold
- GitHub Action that posts a config diff summary as a PR comment
- VS Code extension for in-editor config comparison

## 11. Technical Architecture

### Recommended stack

- Nuxt 4
- Vue 3
- TypeScript
- Tailwind CSS 4
- CodeMirror 6
- Cloudflare Pages / Workers
- Cloudflare D1 (SQLite-based edge database)
- Drizzle ORM (schema definition, migrations, and type-safe queries)
- pnpm (package manager)

### Why this stack

- Nuxt 4 brings the latest compatibility layer, improved defaults, and cleaner module resolution compared to Nuxt 3.
- Tailwind CSS 4 uses a CSS-first configuration approach (no more `tailwind.config.ts`), faster builds via the Oxide engine, and automatic content detection — reducing boilerplate and improving DX.
- The design system and interaction patterns from `diffspot` can be transferred quickly.
- Nuxt is already a proven fit for your personal tooling products.

### Nuxt 4 migration notes

- Nuxt 4 uses the `app/` directory by default (already reflected in the structure below).
- Use `compatibilityVersion: 4` in `nuxt.config.ts` during early development if any module compatibility issues arise.
- Tailwind 4 is configured via `@import "tailwindcss"` in the main CSS file rather than a JS/TS config. Custom design tokens should be defined using `@theme` blocks in CSS.

### Database layer (D1 + Drizzle)

- **Cloudflare D1** provides a SQLite database at the edge, co-located with Workers/Pages — zero cold start, zero egress cost.
- **Drizzle ORM** is the schema and migration layer — it generates SQL migrations from TypeScript schema files and provides type-safe queries.
- Schema lives in `server/database/schema.ts`, migrations in `server/database/migrations/`.
- Use `drizzle-kit` for migration generation (`drizzle-kit generate`) and application (`drizzle-kit migrate` or via Wrangler).
- D1 binding is configured in `wrangler.toml` and accessed in Nitro routes via `hubDatabase()` or directly from the Cloudflare environment bindings.
- Drizzle's `drizzle-orm/d1` adapter connects Drizzle to D1 with no additional drivers needed.

### API routes

The server layer exposes three Nitro API routes:

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/share` | `POST` | Save a comparison to D1, return the short ID and delete token |
| `/api/share/[id]` | `GET` | Retrieve a comparison by ID, increment view count |
| `/api/share/[id]` | `DELETE` | Delete a comparison (requires delete token) |

### Suggested internal structure

```text
app/
├── components/
│   ├── compare/          # input workspace, editor panels, format selector
│   ├── results/          # diff view, summary bar, risk sidebar, export
│   ├── layout/           # header, footer, page shell
│   └── ui/               # buttons, panels, badges, inputs, surfaces
├── composables/          # shared reactive logic (useCompare, useExport, useKeyboard)
├── types/                # shared TypeScript interfaces (ConfigTree, DiffResult, RiskAnnotation)
├── utils/
│   ├── parsers/          # format detection, .env, JSON, YAML, TOML, INI parsers
│   ├── diff/             # raw diff, semantic diff, smart summary
│   └── risk/             # risk classifier, secret detection, severity scoring
├── pages/
└── assets/css/           # Tailwind 4 entry point, @theme tokens, custom styles
server/
├── api/                  # Nitro API routes (share, retrieve, delete comparisons)
├── database/
│   ├── schema.ts         # Drizzle schema definition
│   └── migrations/       # Drizzle-generated SQL migrations
└── utils/                # server-side helpers (nanoid, D1 client)
docs/
└── plans/
```

### Multi-agent implementation strategy

The build should leverage multiple Claude Code agents working in parallel to maximize velocity. Independent workstreams can be assigned to separate agents, each with a clear scope and minimal cross-dependencies.

#### Phase 0 — Foundation (3 agents in parallel)

| Agent | Scope | Output |
|-------|-------|--------|
| **Agent 1: Project scaffold** | Initialize Nuxt 4 project, configure TypeScript, Tailwind 4, ESLint, and CI pipeline | Working `nuxt.config.ts`, `app.vue`, CSS theme file with `@theme` tokens, lint/build passing |
| **Agent 2: Design system** | Build core UI primitives — buttons, panels, surfaces, badges, inputs — using the diffspot visual language | `app/components/ui/` with all base components, themed and documented |
| **Agent 3: Parsing engine** | Build the format detection and parsing layer for `.env`, JSON, YAML, TOML, INI | `app/utils/parsers/` with parse + normalize functions, unit tests for each format |

#### Phase 1 — MVP (4 agents in parallel)

| Agent | Scope | Output |
|-------|-------|--------|
| **Agent 1: Compare workspace UI** | Build the two-panel input workspace with CodeMirror, drag-and-drop, upload, format selector | `app/components/compare/` — fully interactive input surface |
| **Agent 2: Diff engine** | Implement raw text diff, semantic diff, and smart summary generation | `app/utils/diff/` — diff algorithms, semantic grouping, summary builder |
| **Agent 3: Risk engine** | Implement risk classification heuristics, secret detection, severity scoring | `app/utils/risk/` — risk classifier, secret patterns, severity model |
| **Agent 4: Results UI** | Build the diff results view, result summary bar, risk sidebar, and export actions | `app/components/results/` — all output-facing components |

#### Phase 1.5 — Integration (2 agents in parallel)

| Agent | Scope | Output |
|-------|-------|--------|
| **Agent 1: Wiring** | Connect parsing → diff → risk → UI pipeline, implement the main compare flow end-to-end | Working compare page with full data flow |
| **Agent 2: Shareable URLs + polish** | Implement D1/Drizzle schema, share/retrieve API routes, keyboard shortcuts, "Try it" demo, responsive polish | Shareable URLs working, keyboard nav, sample comparisons |

#### Guidelines for agent coordination

- Each agent should work in an **isolated worktree** to avoid merge conflicts.
- Define clear **interface contracts** before agents start: TypeScript types for parsed configs, diff results, and risk annotations should be agreed upon upfront and placed in `app/types/`.
- Agents should write **unit tests** alongside their code so integration issues surface early.
- A final integration pass (single agent or manual) should wire everything together, resolve any interface mismatches, and run end-to-end tests.
- Prefer **thin interfaces** between agent boundaries: parsers return a normalized `ConfigTree`, the diff engine consumes `ConfigTree` pairs, the risk engine annotates diff results. Keep these types minimal and stable.

### Suggested engine split

If the product grows, extract:

- `@configspot/core`
- `@configspot/vue`

This mirrors the successful package split already used in `diffspot`.

## 12. Format Parsing Strategy

### `.env`

- parse as flat key/value pairs
- detect duplicate keys
- detect missing keys
- mask likely secret values in summaries
- detect variable interpolation (`${OTHER_VAR}`) and flag broken references
- detect commented-out keys and surface them as "disabled" rather than "removed"

### `json`

- parse into structured objects
- compare by path
- ignore ordering of object keys
- preserve array order by default
- detect JSON with comments (JSONC) and handle gracefully
- show path breadcrumbs for deeply nested changes (e.g., `server.database.pool.max`)

### `yaml`

- same semantic model as JSON when possible
- show parser errors clearly
- handle nested maps and arrays

### `toml`

- compare by section and key path

### `ini`

- compare by section and key

## 13. Risk Classification Rules

### MVP heuristics

- changed host / URL / port
- removed key
- changed credential-like value
- feature flag toggled
- dependency version changed
- environment target changed
- boolean flipped (e.g., `DEBUG=true` -> `DEBUG=false`)
- numeric threshold changed significantly (e.g., timeout, pool size, retry count)
- value changed from placeholder to real (or vice versa) — e.g., `TODO`, `changeme`, `xxx`

### Severity model

- `info` — cosmetic or low-impact (renamed key, reordered section)
- `review` — functional change that needs human judgment (new feature flag, changed timeout)
- `high impact` — changes that could cause outages or security issues (credentials, hosts, ports, removed keys)

### Secret detection patterns

Configspot should recognize common secret patterns and mask them by default:

- keys containing `SECRET`, `PASSWORD`, `TOKEN`, `API_KEY`, `PRIVATE_KEY`, `CREDENTIALS`
- values that look like base64-encoded strings, JWTs, or connection strings
- AWS access keys, GitHub tokens, and other well-known credential formats
- partial masking preferred: show first 4 and last 4 characters with `****` in between

## 14. Success Criteria

### MVP success

- users can compare two config files in under 30 seconds
- first-time visitors understand the value within 5 seconds via the "Try it" demo
- semantic summaries are clearly more useful than raw line diffs
- parser errors are easy to understand
- risky changes are easy to spot
- the UI feels clearly related to `diffspot` and `edufalcao.com`
- shareable URLs work reliably and produce clean short links

### Growth signals

- users share comparison URLs (organic distribution)
- repeat usage from the same browser (indicates utility, not novelty)
- users try multiple formats (indicates depth of engagement)

## 15. Open Questions

- Should arrays be treated positionally or as sets for some formats?
- How far should comment-awareness go in MVP?
- Should secrets be fully hidden or partially masked by default?
- Should `package.json` and GitHub Actions support be included in MVP or held for Phase 2?
- What is the maximum config size before performance degrades? Should there be a size limit or a streaming/chunked approach?
- What should the default TTL be for shared comparisons? 30 days? 90 days? Permanent by default?
- Should cross-format comparison (e.g., `.env` vs `docker-compose.yml`) be MVP or Phase 2?
- Should there be an "approve" or "sign-off" action on a comparison, turning it into a lightweight review artifact?

## 16. Recommended Build Order

1. Establish the visual system and page shell.
2. Implement `.env` and JSON semantic diff first.
3. Add YAML and TOML support.
4. Add risk summary heuristics.
5. Add export and report generation.
6. Polish responsive behavior, empty states, and parsing errors.
7. Deploy MVP before expanding into package-specific workflows.

## 17. Competitive Landscape

Understanding what exists helps position Configspot clearly:

| Tool | Strength | Gap that Configspot fills |
|------|----------|--------------------------|
| Generic diff tools (diffchecker, etc.) | Broad text diff | No config awareness, no semantic diff, no risk detection |
| `diff` / `vimdiff` | Fast CLI usage | No structured understanding, no web shareability |
| IDE built-in diff | Integrated in workflow | Text-only, no risk heuristics, not shareable |
| Custom scripts | Tailored | Not reusable, no UI, not shareable |

Configspot's unique angle: **config-native intelligence + zero-setup web shareability**.

## 18. Keyboard Shortcuts

Power users should be able to drive the tool entirely from the keyboard:

| Shortcut | Action |
|----------|--------|
| `Ctrl+Enter` | Run comparison |
| `j` / `k` | Navigate to next / previous change |
| `f` | Toggle formatting-only filter |
| `r` | Toggle "risky only" filter |
| `s` | Toggle secret masking |
| `e` | Export current view |
| `u` | Copy shareable URL |
| `1` / `2` / `3` | Switch between raw diff / semantic diff / smart summary |
| `?` | Show shortcut help overlay |

## 19. SEO and Discovery Strategy

As a public web tool, organic search is the primary acquisition channel:

- target long-tail queries like "compare env files online", "yaml diff tool", "toml config compare"
- each supported format should have a dedicated landing variant (e.g., `/compare/env`, `/compare/yaml`) with format-specific copy and preloaded examples
- structured data markup for tool/software application
- fast LCP and good Core Web Vitals (SSR via Nuxt helps here)
- open graph previews that show a mini comparison screenshot

## 20. Accessibility and Internationalization

- all interactive elements keyboard-accessible (not just shortcuts, but full tab navigation)
- color is never the only indicator of change type — use icons and labels alongside color
- ARIA labels on diff regions for screen reader compatibility
- high-contrast mode option beyond just dark/light
- no i18n needed for MVP (English-only), but avoid hardcoded strings — use a simple key-based system so translation is trivial later

## 21. First Deliverable

The first shipping target should be:

> A polished public web app that compares `.env`, JSON, YAML, TOML, and INI files, shows both raw and semantic diffs, highlights risky config changes, supports shareable URLs, and visually feels like a sibling product to `diffspot`.
