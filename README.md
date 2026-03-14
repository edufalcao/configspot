# configspot

Config comparison and validation tool for developers. Compare `.env`, JSON, YAML, TOML, and INI files with semantic diffs, risk detection, and secret masking.

## Setup

```bash
pnpm install
```

## Development

```bash
# Set up local D1 database
npx wrangler d1 execute configspot --local --file=./server/database/migrations/0001_create_comparisons.sql

# Start dev server
pnpm dev
```

## Build

```bash
pnpm build
```

## Verification

```bash
pnpm test:packages
pnpm lint
pnpm typecheck
pnpm build
```

## Deploy

```bash
# Run migrations against remote D1
npx wrangler d1 execute configspot --remote --file=./server/database/migrations/0001_create_comparisons.sql

# Deploy to Cloudflare Pages
pnpm build
npx wrangler pages deploy dist --project-name=configspot
```

Ensure the D1 database binding is configured in Cloudflare Pages:
- Variable name: `DB`
- D1 database: `configspot`

## Tech Stack

- Nuxt 4 (Vue 3 + TypeScript)
- Tailwind CSS 4
- CodeMirror 6
- Cloudflare Pages / Workers
- Cloudflare D1
