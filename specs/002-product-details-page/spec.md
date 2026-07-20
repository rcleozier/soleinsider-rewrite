# Feature Specification: Product Details Page

**Feature Branch**: `[002-product-details-page]`

**Created**: 2026-06-24

**Status**: Draft

**Input**: User description: "Build out the product details page. The page should show a carousel of product images, show an H1 title of sneaker title, use a countdown component that actually counts down to release date, show price, SKU and description if available, show COP/DROP buttons, and show a related products carousel at the bottom. Clarifications resolved: DB-first data source with mock fallback; related products should prioritize same brand and nearby release timing; countdown should tick live in the browser and COP/DROP should post through the existing endpoint with visible count updates."

## Clarifications

### Session 2026-06-24

- Q: How should repeat COP/DROP clicks be counted? -> A: Every click counts as a new vote.
- Q: How should legacy product descriptions render? -> A: Cleaned plain text only.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Inspect Product Details (Priority: P1)

A sneaker collector opens a product detail page from the homepage, calendar, search, or an old SoleInsider URL and can immediately understand the sneaker, release timing, price, SKU, images, and description.

**Why this priority**: Product detail views are the primary conversion outcome for the site, and the detail page must make each product page useful for collectors and Google visitors.

**Independent Test**: Open a valid product detail URL and confirm the page shows a product image carousel, sneaker title as the H1, release countdown, price, SKU, and description when available.

**Acceptance Scenarios**:

1. **Given** a visitor opens a valid product detail page, **When** the page loads, **Then** the sneaker title appears as the page H1.
2. **Given** a product has multiple images, **When** the visitor views the product media area, **Then** they can browse the product images in a carousel.
3. **Given** a product has price, SKU, and description data, **When** the visitor scans the detail content, **Then** those fields are clearly visible.
4. **Given** a product lacks optional description, price, SKU, or secondary images, **When** the page loads, **Then** the page still presents the known product information without broken or misleading states.
5. **Given** a product has existing comments, **When** the visitor reaches the comments area, **Then** those comments remain available on the product detail page.

---

### User Story 2 - Track Release Timing and Vote (Priority: P1)

A visitor uses the detail page to understand how long remains until release and express interest through COP/DROP voting.

**Why this priority**: Countdown and COP/DROP signals are core mobile-app-like engagement features and help turn a product page from static SEO content into a release tool.

**Independent Test**: Open a product detail page with a future release date, confirm the countdown changes over time, submit a COP or DROP vote, and confirm the visible vote state updates.

**Acceptance Scenarios**:

1. **Given** a product has a future release date, **When** the visitor stays on the page, **Then** the countdown updates live without requiring a page refresh.
2. **Given** a product release date has passed, **When** the countdown displays, **Then** it avoids negative time and communicates that the drop is live or elapsed.
3. **Given** a visitor selects COP, **When** the vote is accepted by existing voting behavior, **Then** the visible COP count or percentage updates.
4. **Given** a visitor selects DROP, **When** the vote is accepted by existing voting behavior, **Then** the visible DROP count or percentage updates.
5. **Given** a visitor selects COP or DROP more than once, **When** each vote is accepted, **Then** each click is counted as a new vote.
6. **Given** a visitor has already submitted a successful COP or DROP vote, **When** they click COP or DROP again, **Then** the page allows the new submission rather than locking or disabling future voting.
7. **Given** voting cannot be completed, **When** the visitor selects COP or DROP, **Then** the page preserves the previous vote display and does not block the rest of the product detail experience.

---

### User Story 3 - Discover Related Products (Priority: P2)

A visitor reaches the bottom of a product detail page and finds related products that are relevant by brand and release timing, encouraging additional product detail views.

**Why this priority**: Related product discovery extends the product-detail journey and supports the site's business goal of more product detail views.

**Independent Test**: Open a product detail page and confirm a related products carousel appears at the bottom with local links to other product detail pages.

**Acceptance Scenarios**:

1. **Given** related releases exist for the same brand and nearby release timing, **When** the page renders the related carousel, **Then** those products are prioritized.
2. **Given** not enough same-brand, same-time releases exist, **When** the related carousel renders, **Then** it falls back to other relevant sneaker releases without showing the current product as related.
3. **Given** a visitor selects a related product, **When** they click it, **Then** they navigate to the local product detail page rather than the production SoleInsider site.

---

### User Story 4 - Preserve SEO and Legacy URL Value (Priority: P2)

A Google visitor or returning SoleInsider user lands on an old product URL and receives a rich, crawlable product detail page without changing the existing URL pattern.

**Why this priority**: Release pages are a major SEO surface and old public URLs must remain functional.

**Independent Test**: Open a legacy-compatible product detail URL and confirm the page resolves, has a useful title and metadata, and uses the same public URL structure.

**Acceptance Scenarios**:

1. **Given** a visitor lands on an existing product URL path, **When** the product exists, **Then** the page resolves without redirecting to a new URL structure.
2. **Given** the page renders product details, **When** search engines crawl it, **Then** the title, product metadata, image, description, and links are crawlable.
3. **Given** product data is missing or unavailable, **When** the page cannot identify a valid product, **Then** it returns an appropriate not-found experience instead of a broken page.

### Edge Cases

- If a product has only one image, the carousel must behave as a stable single-image gallery rather than showing broken controls.
- If product image records are missing, the primary product image should be used as the gallery fallback.
- If price, SKU, or description is missing, the page should show known fields and use clear fallback language for unknown fields.
- If a legacy product description contains HTML, the page must strip or sanitize it and render only cleaned plain text as crawlable content.
- If a legacy product description is empty after cleaning, the page should hide the description section or use the normal unknown-field fallback.
- If release date is missing or malformed, the countdown should avoid misleading time values and the page should still show product details.
- If the release date has already passed, the countdown should not show negative values.
- If a visitor clicks COP or DROP repeatedly, each accepted click should count as an additional vote.
- If COP/DROP voting fails, the page should keep the existing visible vote counts and avoid duplicate or confusing vote feedback.
- If related products are sparse, the carousel should fall back to relevant sneaker releases and avoid linking the current product.
- If a visitor is on mobile, carousel controls, countdown, facts, voting, and related products should remain usable within the page layout.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Product detail pages MUST use the existing legacy-compatible product URL structure.
- **FR-002**: Product detail pages MUST use database-backed product, release, and product image data as the primary source, with existing mock data as a fallback when database data is unavailable.
- **FR-003**: Product detail pages MUST display the sneaker title as the page H1.
- **FR-004**: Product detail pages MUST display a product image carousel using available product images.
- **FR-005**: The product image carousel MUST include the primary product image when no secondary images are available.
- **FR-006**: Product detail pages MUST display release price, SKU, and description when those fields are available.
- **FR-006a**: Product descriptions MUST render as cleaned plain text from legacy product description fields, stripping or sanitizing HTML and never rendering unsafe HTML.
- **FR-007**: Product detail pages MUST clearly communicate unknown or unavailable price, SKU, description, image, or release date data without presenting it as confirmed.
- **FR-008**: Product detail pages MUST include a countdown that updates live toward the product release date.
- **FR-009**: The countdown MUST avoid negative values after a release date has passed and indicate an elapsed or live-release state.
- **FR-010**: Product detail pages MUST display COP and DROP buttons with current voting counts or percentages.
- **FR-011**: COP/DROP buttons MUST submit through existing voting behavior and update the visible vote display after each successful vote.
- **FR-011a**: Every accepted COP or DROP click MUST be persisted as a new vote event, and the page MUST NOT lock the visitor out or disable future votes after a successful vote.
- **FR-012**: Product detail pages MUST preserve a usable page state if COP/DROP voting fails.
- **FR-013**: Product detail pages MUST include a related products carousel at the bottom of the page.
- **FR-014**: Related products MUST prioritize products from the same brand and nearby release timing, then fall back to other relevant sneaker releases when needed.
- **FR-014a**: Related product lookup MUST use one bounded related-products query per product detail render.
- **FR-015**: Related products MUST exclude the current product.
- **FR-016**: Related product links MUST navigate to local product detail pages, not production SoleInsider product URLs.
- **FR-017**: Product detail pages MUST include crawlable product title, image, price, SKU, description, release date, and related product links when available.
- **FR-018**: Product detail pages MUST remain usable on mobile, including carousel interaction, countdown visibility, COP/DROP actions, facts, and related product browsing.
- **FR-019**: Product detail pages MUST continue to support existing product comments when comments already exist for that product.

### Key Entities *(include if feature involves data)*

- **Product Detail Page**: The page representing one sneaker release, reached through the legacy-compatible product URL.
- **Product**: The sneaker item with title, primary image, price, SKU, description, slug, product ID, brand/type, and related metadata.
- **Product Description**: Cleaned plain text derived from legacy product description content; unsafe or presentational HTML is not rendered.
- **Release**: The release date and timing information associated with the product.
- **Product Image**: One image belonging to the product gallery, including the primary product image and any additional carousel images.
- **Countdown**: A live release-timing display derived from the product release date.
- **COP/DROP Vote**: A visitor engagement action and visible demand signal for the product; each accepted click is a separate vote.
- **Related Product**: Another sneaker release selected by same brand and nearby release timing, with fallback to other relevant sneaker releases.
- **Product Comment**: An existing visitor comment associated with the product and preserved on the detail page when present.
- **Legacy Product URL**: Existing public SoleInsider product URL pattern that must continue to resolve locally in the rewrite.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At least 90% of valid product detail pages display a title, image, release date, price or price fallback, SKU or SKU fallback, countdown, and COP/DROP controls.
- **SC-002**: Visitors can identify the sneaker title, release date, price, SKU, and COP/DROP state within 10 seconds of opening a product detail page.
- **SC-003**: At least 90% of products with additional image data show two or more carousel images.
- **SC-004**: The countdown visibly changes within 2 seconds on pages with future release dates.
- **SC-005**: Each successful COP or DROP click updates the visible vote display without requiring a page refresh.
- **SC-006**: At least 90% of product detail pages show three or more related products when sufficient product data exists.
- **SC-007**: 100% of related product links and primary product page links stay on local product detail routes.
- **SC-008**: Existing high-value product detail URL paths continue to resolve without avoidable redirects or dead ends.
- **SC-009**: Mobile visitors can browse the image carousel, read product facts, vote COP/DROP, and open a related product without layout overlap or blocked controls.
- **SC-010**: Product descriptions render as crawlable plain text and never expose legacy HTML markup in the product detail body.

## Assumptions

- The primary users are sneaker collectors and search visitors evaluating a specific release.
- Database-backed product, release, and product image data should be used first, with mock data retained only as fallback resilience.
- Related products should mean same brand plus nearby release timing; "nearby" can be defined during planning using existing release date data.
- COP/DROP voting should use existing voting behavior rather than introducing a new voting system.
- The product detail page should preserve the current legacy-compatible URL structure.
- The feature may improve the product detail UI and data presentation, but should not change backend API contracts unless a later planning step explicitly scopes that work.
