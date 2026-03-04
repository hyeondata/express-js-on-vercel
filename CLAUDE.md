# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Korean-English flashcard study app built with Express.js (TypeScript) and deployed on Vercel as a serverless function. Includes a spaced-repetition review system with per-account difficulty scaling.

## Commands

- **Local dev server:** `npm run start` (or `npm run dev:local`) — runs on port 3000 using Node's `--experimental-strip-types` (no build step needed)
- **Deploy preflight:** `npm run deploy:check` — validates health, accounts, cards, study, and share-mode endpoints against a running server
- **MCP server:** `npm run mcp:flashcard` — starts the stdio MCP server for OpenClaw integration
- **Debug flashcard API:** `npm run debug:flashcard` — sequential health/accounts/cards/stats/difficulty checks
- **OpenClaw register:** `npm run openclaw:register` — copies skill + updates `~/.openclaw/openclaw.json`

There is no build, lint, or test command. TypeScript is stripped at runtime via `--experimental-strip-types`.

## Architecture

### Single-file server (`src/index.ts`)
The entire Express app lives in one file. It exports the app as the default export — Vercel's `@vercel/node` builder imports it directly, while `scripts/run-local.mjs` wraps it with `app.listen()` for local dev.

### Data storage
- **Local:** JSON file at `data/store.json` (accounts + cards)
- **Vercel:** writes to `/tmp/flash-data/store.json` (ephemeral per cold start)
- **Override:** set `FLASHCARD_DATA_DIR` env var to use a custom path
- State is held in-memory (`Map<string, Account>` for accounts, `FlashCard[]` for cards) and synced to disk on every write

### Multi-account model
Every API request resolves an account via `x-account-id` header or `?accountId=` query param (defaults to `"guest"`). Cards are scoped to accounts. Share mode (`x-share-mode: true` header) blocks all write operations.

### Spaced repetition
Strength (0–5) and difficulty (1–5) per card determine review intervals via `nextReviewMinutes()` × `difficultyMultiplier()`. Review results: `again` / `hard` / `good`.

### Vercel deployment
`vercel.json` routes all requests (`/(.*)`) to `src/index.ts`. The `includeFiles` config bundles `public/**` and `components/**` into the function. Static files are served via `express.static('public')`.

### Frontend
`public/index.html` + `public/app.js` + `public/style.css` — vanilla JS SPA that communicates with the API. Account ID persisted in `localStorage` as `flash-account-id`.

### CI
GitHub Actions workflow (`.github/workflows/deploy-check.yml`) runs `npm run deploy:check` against a local server on every push/PR to main.

## Key Conventions

- Error messages and UI text are in Korean
- The project uses ESM (`"type": "module"` in package.json)
- Node 22+ required (for `--experimental-strip-types`)
- `resolveProjectPath()` handles path resolution across Vercel and local environments by checking multiple candidate roots
