# Data Model: Product Details Page

## Product Detail

Represents one sneaker product page.

**Fields used**: product ID, slug, name, SKU, price, description/content, type, brand-derived label, primary image, release date, vote counts, local detail URL, absolute canonical URL.

**Relationships**: Has one release date, many product images, many release-interest votes, many comments, and many related products.

**Validation rules**: Product ID and slug must identify the requested product for legacy routes. Unknown price, SKU, description, or release date must use clear fallback text.

## Product Image

Represents one gallery image.

**Fields used**: image filename or URL, product ID, optimized flag when available.

**Relationships**: Belongs to one product.

**Validation rules**: The primary product image must be included when no gallery images exist. Duplicate image URLs should not appear in the carousel.

## Release

Represents product release timing.

**Fields used**: product ID, release date, formatted release date, calendar countdown value.

**Relationships**: Belongs to one product and is used to select related products by nearby timing.

**Validation rules**: Invalid or missing dates must not produce negative or misleading countdown values.

## COP/DROP Vote

Represents a user's release-interest action.

**Fields used**: product ID, member ID or anonymous value, status, created timestamp.

**Relationships**: Belongs to one product and contributes to yes/no vote counts and percentages.

**Validation rules**: Accepted vote statuses are COP/yes and DROP/no equivalents from the existing endpoint contract. Successful votes must update visible counts.

## Related Product

Represents another sneaker shown in the bottom carousel.

**Fields used**: product ID, slug, name, image, brand, release date, price, SKU, vote signal.

**Relationships**: Selected from products/releases using same brand and 90-day release-date proximity first, then fallback releases.

**Validation rules**: Must exclude the current product and link to a local product detail path.

## Comment

Represents existing product discussion shown below related products.

**Fields used**: comment ID, product ID, comment body, comment date, upvote count.

**Relationships**: Belongs to one product.

**Validation rules**: Empty comments should not create broken layout; comments remain secondary to related products.
