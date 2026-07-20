# Tasks: Product Details Page

**Input**: Design documents from `specs/002-product-details-page/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/product-detail-ui.md, quickstart.md

**Tests**: No explicit TDD requirement was requested. Validation tasks are included in the final phase.

**Organization**: Tasks are grouped by user story so each story can be implemented and tested independently.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm current route/component boundaries and prepare shared types without changing schema.

- [ ] T001 Inspect current detail route loaders in `src/app/[slug]/[productId]/page.tsx` and `src/app/releases/[slug]/page.tsx` to preserve URL behavior before edits
- [ ] T002 Inspect current detail UI and voting components in `src/components/ReleaseDetailView.tsx`, `src/components/CountdownModule.tsx`, and `src/components/CopDropButtons.tsx`
- [ ] T003 [P] Document current DB fields used by product detail helpers in `src/lib/dbReleases.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build the DB-first detail data layer required by all product detail stories.

**CRITICAL**: No user story work should begin until this phase is complete.

- [ ] T004 Add a `ProductDetailData` type and related image/comment/related product types in `src/lib/dbReleases.ts`
- [ ] T005 Implement `getDbReleaseBySlugAndId(slug, productId)` in `src/lib/dbReleases.ts` using `products`, `releases`, `release_interest`, and `comments`
- [ ] T006 Implement `getDbReleaseBySlug(slug)` in `src/lib/dbReleases.ts` for `/releases/[slug]`
- [ ] T007 Implement `getDbProductImages(productId, primaryImage)` in `src/lib/dbReleases.ts` using `product_images` with primary-image fallback and duplicate removal
- [ ] T008 Implement `getDbProductComments(productId)` in `src/lib/dbReleases.ts` using `comments`
- [ ] T009 Implement `mapDbReleaseToLegacyRelease` export support or a detail-specific mapper in `src/lib/dbReleases.ts`
- [ ] T010 Update fallback helpers in `src/lib/legacyMobileApi.ts` only if needed to provide mock image/comment data without changing endpoint contracts
- [ ] T011 Update shared image URL handling in `src/lib/productImages.ts` only if carousel image records expose leading slashes or absolute URLs differently from primary product images

**Checkpoint**: Detail routes can request a DB-first product detail object, images, comments, and fallback data without rendering new UI yet.

---

## Phase 3: User Story 1 - Inspect Product Details (Priority: P1) MVP

**Goal**: A visitor opens a product detail URL and can inspect title, image carousel, release date, price, SKU, and description.

**Independent Test**: Open `/air-jordan-14-se-reverse-ferrari/5217` and confirm the H1, carousel, release facts, price, SKU, and description render with no broken state.

### Implementation for User Story 1

- [ ] T012 [US1] Update `src/app/[slug]/[productId]/page.tsx` to load DB-first detail data via `getDbReleaseBySlugAndId` and fall back to `getReleaseBySlugAndId`
- [ ] T013 [US1] Update `src/app/releases/[slug]/page.tsx` to load DB-first detail data via `getDbReleaseBySlug` and fall back to `getReleaseBySlug`
- [ ] T014 [P] [US1] Create `src/components/ProductImageCarousel.tsx` with single-image and multi-image carousel states
- [ ] T015 [P] [US1] Add carousel, thumbnail, and product-fact styles in `src/app/globals.css`
- [ ] T016 [US1] Update `src/components/ReleaseDetailView.tsx` props to accept release, images, comments, and related products from the route loaders while preserving existing product comments when present
- [ ] T017 [US1] Replace the single hero image in `src/components/ReleaseDetailView.tsx` with `ProductImageCarousel`
- [ ] T018 [US1] Render H1 title, release date, retail price fallback, SKU fallback, and cleaned plain-text description in `src/components/ReleaseDetailView.tsx`, stripping/sanitizing legacy HTML and hiding the section or using the normal unknown-field fallback when empty after cleaning
- [ ] T019 [US1] Update product JSON-LD in `src/components/ReleaseDetailView.tsx` to use the DB-first image list and product description when available
- [ ] T020 [US1] Ensure `/air-jordan-14-se-reverse-ferrari/5217` and `/releases/air-jordan-14-se-reverse-ferrari` still resolve through their existing files

**Checkpoint**: User Story 1 is independently functional as a DB-first detail page with a product image carousel and complete facts.

---

## Phase 4: User Story 2 - Track Release Timing and Vote (Priority: P1)

**Goal**: A visitor sees a live countdown and can persist COP/DROP votes through the existing voting endpoint.

**Independent Test**: Open a future release page, confirm the countdown changes within 2 seconds, submit COP or DROP, and confirm visible counts update without refresh.

### Implementation for User Story 2

- [ ] T021 [P] [US2] Create `src/components/LiveCountdown.tsx` with browser-ticking days/hours/minutes/seconds and elapsed-state handling
- [ ] T022 [US2] Replace detail-page usage of `CountdownModule` with `LiveCountdown` in `src/components/ReleaseDetailView.tsx`
- [ ] T023 [P] [US2] Update `src/components/CopDropButtons.tsx` to support client-side submission, loading state, error state, and optimistic count updates without locking out or disabling future votes after a successful vote
- [ ] T024 [US2] Update `src/app/mobileapi/coporNot/route.ts` to preserve the existing request/response contract while delegating persistence to a DB helper
- [ ] T025 [US2] Add `recordDbCopDropVote(productId, status, memberId)` and `getDbVoteSummary(productId)` helpers in `src/lib/dbReleases.ts`, persisting every accepted COP or DROP click as a new vote event
- [ ] T026 [US2] Update `src/components/ReleaseDetailView.tsx` to pass product ID and initial vote counts into `CopDropButtons`
- [ ] T027 [US2] Ensure failed COP/DROP submissions preserve previous visible counts and show non-blocking feedback in `src/components/CopDropButtons.tsx`
- [ ] T028 [US2] Add countdown and voting styles for desktop/mobile states in `src/app/globals.css`

**Checkpoint**: User Story 2 works independently on a detail page with live countdown and DB-persisted voting through the existing endpoint.

---

## Phase 5: User Story 3 - Discover Related Products (Priority: P2)

**Goal**: A visitor reaches the bottom of a detail page and finds same-brand products near the release date, with fallback products if needed.

**Independent Test**: Open a product detail page and confirm the related carousel appears above comments, excludes the current product, prioritizes same-brand products within 90 days, and uses local links.

### Implementation for User Story 3

- [ ] T029 [US3] Implement `getDbRelatedReleases(currentRelease, limit)` in `src/lib/dbReleases.ts` using one bounded related-products query per detail render, same brand within 90 days, closest release date first, and fallback recent sneakers
- [ ] T030 [P] [US3] Create `src/components/RelatedProductsCarousel.tsx` using local `getReleaseUrl` links and product image helpers
- [ ] T031 [P] [US3] Add related-products carousel styles in `src/app/globals.css`
- [ ] T032 [US3] Update `src/app/[slug]/[productId]/page.tsx` to pass related products from `getDbRelatedReleases` into `ReleaseDetailView`
- [ ] T033 [US3] Update `src/app/releases/[slug]/page.tsx` to pass related products from `getDbRelatedReleases` into `ReleaseDetailView`
- [ ] T034 [US3] Render `RelatedProductsCarousel` below main product details and above comments in `src/components/ReleaseDetailView.tsx`
- [ ] T035 [US3] Ensure related-product fallback excludes the current product and never emits production product URLs in `src/lib/dbReleases.ts`

**Checkpoint**: User Story 3 is independently functional with bottom related product discovery and local navigation.

---

## Phase 6: User Story 4 - Preserve SEO and Legacy URL Value (Priority: P2)

**Goal**: Legacy-compatible product URLs and `/releases/[slug]` render crawlable product details without avoidable redirects or dead ends.

**Independent Test**: Open both product detail route styles and confirm metadata, JSON-LD, local links, and not-found behavior remain correct.

### Implementation for User Story 4

- [ ] T036 [US4] Update metadata generation in `src/app/[slug]/[productId]/page.tsx` to use DB-first release data with mock fallback
- [ ] T037 [US4] Update metadata generation in `src/app/releases/[slug]/page.tsx` to use DB-first release data with mock fallback
- [ ] T038 [US4] Confirm canonical/local URL behavior uses `getReleaseUrl` for local links and `getAbsoluteReleaseUrl` only for metadata in `src/lib/siteData.ts`
- [ ] T039 [US4] Ensure not-found behavior remains intact for missing DB and missing mock products in `src/app/[slug]/[productId]/page.tsx`
- [ ] T040 [US4] Ensure not-found behavior remains intact for missing DB and missing mock products in `src/app/releases/[slug]/page.tsx`

**Checkpoint**: User Story 4 preserves SEO and legacy routing behavior independently of homepage changes.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Validate feature completeness and polish responsive behavior.

- [ ] T041 [P] Run `npm run lint` from the repository root
- [ ] T042 [P] Run `npm run build` from the repository root
- [ ] T043 Validate quickstart scenarios in `specs/002-product-details-page/quickstart.md`
- [ ] T044 Smoke-check `/air-jordan-14-se-reverse-ferrari/5217`, `/releases/air-jordan-14-se-reverse-ferrari`, and one product with multiple DB images in the browser
- [ ] T045 Verify mobile layout for carousel controls, countdown, facts, voting buttons, related carousel, and comments in `src/app/globals.css`
- [ ] T046 Check `git diff --name-only` to confirm no Prisma schema, migration, or public URL structure changes were introduced

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Setup and blocks all user stories
- **US1 Inspect Product Details (Phase 3)**: Depends on Foundational
- **US2 Track Release Timing and Vote (Phase 4)**: Depends on Foundational and can run alongside US1 after shared detail props are agreed
- **US3 Discover Related Products (Phase 5)**: Depends on Foundational and integrates into `ReleaseDetailView`
- **US4 Preserve SEO and Legacy URL Value (Phase 6)**: Depends on Foundational and should be checked after route loader changes
- **Polish (Phase 7)**: Depends on selected user stories being complete

### User Story Dependencies

- **US1 (P1)**: MVP and best first implementation target
- **US2 (P1)**: Can start after Foundational; final integration touches `ReleaseDetailView`
- **US3 (P2)**: Can start after Foundational; final placement depends on `ReleaseDetailView`
- **US4 (P2)**: Can start after route loader DB helpers exist; validates no SEO/URL regressions

### Parallel Opportunities

- T003 can run in parallel with T001-T002.
- T014 and T015 can run in parallel after Foundational.
- T021 and T023 can run in parallel for US2.
- T030 and T031 can run in parallel for US3.
- T041 and T042 can run in parallel if separate shells are available after implementation.

---

## Parallel Example: User Story 1

```bash
Task: "Create src/components/ProductImageCarousel.tsx with single-image and multi-image carousel states"
Task: "Add carousel, thumbnail, and product-fact styles in src/app/globals.css"
```

## Parallel Example: User Story 2

```bash
Task: "Create src/components/LiveCountdown.tsx with browser-ticking days/hours/minutes/seconds and elapsed-state handling"
Task: "Update src/components/CopDropButtons.tsx to support client-side submission, loading state, error state, and optimistic count updates"
```

## Parallel Example: User Story 3

```bash
Task: "Create src/components/RelatedProductsCarousel.tsx using local getReleaseUrl links and product image helpers"
Task: "Add related-products carousel styles in src/app/globals.css"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 and Phase 2.
2. Complete Phase 3 for DB-first product detail facts and image carousel.
3. Validate `/air-jordan-14-se-reverse-ferrari/5217` independently.
4. Stop and demo before adding live voting or related products if a smaller release is desired.

### Incremental Delivery

1. Deliver US1 for core detail page value.
2. Add US2 for live countdown and persistent COP/DROP voting.
3. Add US3 for related product discovery.
4. Add US4 checks to protect SEO and legacy URLs.
5. Run Phase 7 validation before handing off.
