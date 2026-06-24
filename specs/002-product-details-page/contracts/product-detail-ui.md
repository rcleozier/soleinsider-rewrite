# Product Detail UI Contract

## Routes

- `/{slug}/{productId}` must render the improved product detail page.
- `/releases/{slug}` must render the same improved detail experience when the product can be resolved.
- Product and related-product links must use local detail paths, not production SoleInsider product URLs.

## Data Priority

1. Load product, release, product images, vote counts, comments, and related products from the database.
2. If DB data is unavailable, fall back to existing mock release and comment data.
3. If optional fields are missing, show explicit fallback text rather than blank or misleading values.

## Page Content

- H1 sneaker title.
- Product image carousel using all available product images with primary image fallback.
- Live countdown that ticks in the browser and never shows negative values.
- Price, SKU, release date, COP/DROP state, and description when available.
- COP/DROP buttons that submit to existing voting behavior and update visible counts on success.
- Related products carousel below main product details.
- Existing comments below the related products section.

## Related Products

- Prioritize same-brand products with release dates within 90 days of the current product.
- Sort closest release date proximity first.
- Exclude the current product.
- Fill remaining carousel slots with other relevant/recent sneaker releases when needed.

## Voting Behavior

- Continue accepting the existing `/mobileapi/coporNot` request contract.
- Persist votes to the existing release-interest data store.
- Preserve prior visible counts if voting fails.
- Do not introduce a new public voting endpoint for this feature.

## Responsive Behavior

- Carousel, countdown, facts, voting buttons, related products, and comments must remain usable on mobile.
- Above-the-fold product imagery should load without broken layout or distorted aspect ratio.
