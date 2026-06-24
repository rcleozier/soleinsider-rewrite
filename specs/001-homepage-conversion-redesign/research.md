# Research: Homepage Conversion Redesign

## Decision: Keep the redesign homepage-only

**Rationale**: The approved spec explicitly excludes release detail redesigns, backend API changes, data model changes, URL structure changes, and content migration. Homepage composition can improve product-detail click-through and SEO discovery without expanding scope.

**Alternatives considered**: Reworking release detail pages or APIs was rejected because it violates the feature non-goals and increases regression risk for the legacy mobile app.

## Decision: Use existing DB-backed release helpers with mock fallback

**Rationale**: The homepage already reads release data from the migrated database and falls back to mock data if DB reads fail. This keeps the homepage grounded in production-like release data while preserving local resilience.

**Alternatives considered**: Adding new API endpoints or migrations was rejected because the feature is frontend composition only.

## Decision: Define newest releases by product creation/add date

**Rationale**: The business goal is to make newly added release content feel like a content feed. Product creation/add date better represents site freshness than future release date.

**Alternatives considered**: Ordering by release date alone was rejected because it can bury recently added historical or newly imported products.

## Decision: Use existing mobile search endpoint for hero search

**Rationale**: `/mobileapi/search?search=` already exists and returns release-shaped records with legacy URLs. Calling it from a client search component avoids adding backend surface area.

**Alternatives considered**: Creating a new homepage search route was rejected because the plan forbids API changes.

## Decision: Document a UI contract instead of API contracts

**Rationale**: This feature changes user-facing homepage behavior and module ordering, not backend wire formats. A UI contract gives implementers and testers a clear acceptance target without implying API changes.

**Alternatives considered**: OpenAPI-style contracts were rejected because no backend endpoints are introduced or changed.
