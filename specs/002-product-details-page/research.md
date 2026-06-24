# Research: Product Details Page

## Decision: DB-first detail source with mock fallback

**Rationale**: The database already contains `products`, `releases`, `product_images`, `release_interest`, and `comments`, which match the detail page needs. Mock fallback preserves local resilience and avoids blocking development if DB reads fail.

**Alternatives considered**: Mock-only was rejected because the product page should use migrated production data. API-only was rejected because the server routes can read the DB directly while preserving mobile API compatibility.

## Decision: Persist COP/DROP through existing endpoint contract

**Rationale**: The existing `/mobileapi/coporNot` route already matches the legacy mobile app contract. Updating its internals to write `release_interest` keeps old clients compatible while allowing web votes to persist and counts to reflect DB data.

**Alternatives considered**: Session-only voting was rejected because votes would disappear and conflict with the DB-first direction. Display-only voting was rejected because the user explicitly chose live voting.

## Decision: Related products are same brand within 90 days

**Rationale**: Same-brand products near the current release date are most likely to be relevant to collectors comparing upcoming or recent drops. A 90-day window balances relevance with enough inventory for a carousel.

**Alternatives considered**: A 30-day window was rejected as too sparse. Same-brand any-date was rejected as less useful for release planning.

## Decision: Shared implementation for both detail routes

**Rationale**: Both `/{slug}/{productId}` and `/releases/{slug}` already render through the same `ReleaseDetailView`. Improving the shared view keeps route behavior consistent and avoids duplicating detail UI.

**Alternatives considered**: Updating only one route was rejected because the user chose both route surfaces.

## Decision: Keep comments below related products

**Rationale**: Related products better support the primary product-detail-view conversion goal, while comments still provide continuity with the existing mobile conversation feature.

**Alternatives considered**: Comments above related products was rejected because it would compete with product discovery. Removing comments was rejected because existing detail page value should be preserved.

## Decision: Product image carousel uses product images with primary fallback

**Rationale**: The `product_images` table contains secondary gallery images, while the `products.image` field provides a reliable primary image fallback. This satisfies multi-image products and stable single-image products.

**Alternatives considered**: Relying only on the legacy slideshow mock was rejected because DB image data exists and should be primary.
