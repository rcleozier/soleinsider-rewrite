# Quickstart: Homepage Conversion Redesign

## Prerequisites

- Dependencies installed with `npm install`.
- `.env` configured for the existing database if DB-backed release data should be used.
- Legacy/mobile endpoints already available in the app.

## Validation Commands

```bash
npm run lint
npm run build
```

## Manual Validation

1. Start the app with `npm run dev`.
2. Open `/` and confirm the homepage modules render in this order:
   hero with search, newest releases feed, featured release, release calendar preview, trending/most voted, archive/on-this-day, app download CTA, SEO content block.
3. Search for `jordan` in the hero search and confirm inline results appear and link to release/product detail pages.
4. Confirm release links use existing SoleInsider-style product URLs.
5. Confirm `/calendar`, `/articles`, brand release URLs, and legacy product URLs still resolve.
6. Confirm no backend route, Prisma schema, migration, or release detail page behavior changed.
7. Check a mobile viewport and confirm the value proposition, search, newest release path, and at least one conversion action appear within a short initial scroll.

## Expected Outcomes

- Homepage product detail paths are more prominent.
- Search and calendar are immediately discoverable.
- App download remains visible but secondary to web engagement.
- Existing URLs and legacy mobile APIs continue to work unchanged.
