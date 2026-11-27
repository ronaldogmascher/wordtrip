# WordTrip — notes for Claude

WordTrip is an offline-first PWA for learning vocabulary (English first, Spanish next) with
context-based flashcards (one card per word *sense*), FSRS scheduling and a gamified motorhome
road trip from Santo André (Brazil) to New York. The owner (Ronaldo) does not code: Claude writes
and maintains everything, so keep the code simple, well-named and easy to change.

The full product plan lives in a Claude Doc ("WordTrip — Plano da Versão 1"); decisions are also
in the project memory.

## Conventions
- Repository, code, comments, commits and PRs: **English** (this repo is a public portfolio).
- App UI text: **Portuguese (pt-BR)**; card content in the target language.
- Stack: Vite + React + TypeScript, react-router (HashRouter), Dexie (IndexedDB), ts-fsrs,
  vite-plugin-pwa. No backend, no paid APIs: everything must work offline.
- Hosted on GitHub Pages at `/wordtrip/` (see `base` in `vite.config.ts`), deployed by
  `.github/workflows/deploy.yml` on every push to `main`.
- Traffic-light colors are used everywhere: red = discovering (new or forgotten), yellow = learning (interval 1–20 days),
  green = learned (interval ≥ 21 days). Always pair colors with icons.

## Commands
- `npm run dev` — local dev server
- `npm run lint` — oxlint
- `npm test` — vitest
- `npm run build` — type-check and production build
