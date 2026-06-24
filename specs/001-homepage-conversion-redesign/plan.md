# Implementation Plan: Homepage Conversion Redesign

**Branch**: `[001-homepage-conversion-redesign]` | **Date**: 2026-06-24 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-homepage-conversion-redesign/spec.md`

## Summary

Recompose the SoleInsider homepage to increase product detail views and SEO value by making search, newest releases, release metadata, calendar access, voting signals, archive depth, app downloads, and crawlable context more prominent. The work is homepage-only and preserves existing backend APIs, Prisma models, release detail pages, URL structure, and migrated content.

## Technical Context

**Language/Version**: TypeScript 6, React 19, Next.js 16 App Router

**Primary Dependencies**: Next.js, React, `next/image`, existing SoleInsider components and data helpers

**Storage**: Existing PostgreSQL/Prisma-backed release reads with mock fallback; no schema changes

**Testing**: `npm run lint`, `npm run build`, manual homepage and route verification

**Target Platform**: Web browser, responsive desktop and mobile

**Project Type**: Next.js web application

**Performance Goals**: Keep homepage server-rendered for release content, avoid adding new backend round trips except user-initiated hero search, and keep above-the-fold imagery optimized through existing image helpers.

**Constraints**: Homepage-only composition/style change; no release detail redesign, backend API changes, data model changes, URL structure changes, or content migration.

**Scale/Scope**: One public homepage with eight required content modules, using existing seeded release/archive data.

## Constitution Check

The constitution file still contains placeholder principles only, so there are no active project governance gates. The feature must satisfy the approved spec non-goals and preserve existing public URL expectations.

## Project Structure

### Documentation (this feature)

```text
specs/001-homepage-conversion-redesign/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── homepage-ui.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── HeroSearch.tsx
│   ├── CountdownModule.tsx
│   ├── CopDropButtons.tsx
│   └── ReleaseCard.tsx
└── lib/
    ├── dbReleases.ts
    └── siteData.ts
```

**Structure Decision**: Implement in the existing Next.js app. Add only presentational/client homepage support where needed, and reuse existing release detail links, app links, image helpers, and COP/DROP/countdown components.

## Complexity Tracking

No constitution violations or added architectural complexity.
