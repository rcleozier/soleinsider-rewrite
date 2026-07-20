# Implementation Plan: Product Details Page

**Branch**: `[002-product-details-page]` | **Date**: 2026-06-24 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-product-details-page/spec.md`

## Summary

Build a richer product detail experience for both `/{slug}/{productId}` and `/releases/{slug}` by loading product/release/image/vote data from the database first, falling back to the existing mock data if needed, and rendering a product image carousel, live countdown, price/SKU/cleaned plain-text description facts, repeatable persistent COP/DROP voting, related products, and existing comments.

## Technical Context

**Language/Version**: TypeScript 6, React 19, Next.js 16 App Router

**Primary Dependencies**: Next.js, React, Prisma 7, `@prisma/adapter-pg`, `pg`, existing image helpers and legacy mobile endpoint contracts

**Storage**: Existing PostgreSQL database via Prisma; no new tables or migrations planned

**Testing**: `npm run lint`, `npm run build`, local route smoke tests, manual browser checks for carousel/countdown/voting

**Target Platform**: Responsive web browser

**Project Type**: Next.js web application with server-rendered detail pages and client-side interactive widgets

**Performance Goals**: Product detail pages should render DB-backed product data on first load, use one bounded related-products query per detail render, and keep above-the-fold product imagery optimized.

**Constraints**: Preserve existing URL structure and mobile API request/response contract. COP/DROP may change endpoint internals to persist votes, but the public endpoint shape remains compatible.

**Scale/Scope**: Two product detail entry routes sharing one detail view, existing product image, comment, and vote tables, related carousel of same-brand products within 90 days with fallback releases and a bounded result count.

**Safety/Data Rendering**: Legacy product descriptions render as cleaned plain text only. HTML is stripped or sanitized before display and unsafe HTML is never rendered in the product detail body.

**Voting Behavior**: Each accepted COP or DROP click is persisted as a new vote event. The UI may show loading or failure feedback, but it must not lock visitors out or disable future votes after one successful vote.

## Constitution Check

The constitution file contains placeholders only, so there are no active governance gates. The plan must still preserve the approved specification, existing legacy URL behavior, and existing mobile API contracts.

## Project Structure

### Documentation (this feature)

```text
specs/002-product-details-page/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── product-detail-ui.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── [slug]/[productId]/page.tsx
│   ├── releases/[slug]/page.tsx
│   └── mobileapi/coporNot/route.ts
├── components/
│   ├── ReleaseDetailView.tsx
│   ├── ProductImageCarousel.tsx
│   ├── RelatedProductsCarousel.tsx
│   ├── LiveCountdown.tsx
│   └── CopDropButtons.tsx
└── lib/
    ├── dbReleases.ts
    ├── legacyMobileApi.ts
    ├── productImages.ts
    └── siteData.ts
```

**Structure Decision**: Reuse the existing route structure and shared `ReleaseDetailView`; add small interactive components for gallery, countdown, related products, and voting as needed. Extend DB helper functions instead of adding routes or schema.

## Complexity Tracking

No constitution violations or added architectural complexity.
