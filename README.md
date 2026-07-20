# SoleInsider Web Rewrite

A Next.js app scaffolded with the App Router, TypeScript, and ESLint.

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:3000 to view the app.

## Rewrite Constitution

This rewrite is governed by `.specify/memory/constitution.md`. The two primary
non-negotiables are preserving the existing mobile app API contract and
preserving legacy public URLs that may exist in Google's index.

Concrete legacy mobile endpoints, public URL patterns, and redirect decisions
live in `docs/legacy-compatibility.md`.
