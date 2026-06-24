# Data Model: Homepage Conversion Redesign

## Release

Represents a sneaker or product drop shown on the homepage.

**Fields used**: name, image, release date, created/add date, price, SKU, brand/category, product/detail URL, COP votes, DROP votes, content/dek.

**Relationships**: A release links to one product detail page and may have release interest votes.

**Validation rules**: Show only known metadata as confirmed. If price, SKU, date, image, or voting data is missing, present an appropriate fallback without implying certainty.

## Search Action

Represents a visitor query from the homepage hero.

**Fields used**: query text, returned release results, result URL.

**Relationships**: Search results link to release/product detail pages through existing legacy-compatible URLs.

**Validation rules**: Empty queries do not produce results. Failed searches should not block the rest of the homepage.

## Homepage Module

Represents one of the eight ordered homepage sections.

**Fields used**: module name, position, heading, supporting copy, release items or links, conversion action.

**Relationships**: Modules may contain releases, calendar links, app links, voting signals, or crawlable SEO links.

**Validation rules**: Modules must render in the approved order: hero with search, newest releases feed, featured release, release calendar preview, trending/most voted, archive/on-this-day, app download CTA, SEO content block.

## Conversion Action

Represents a measurable homepage action.

**Fields used**: action type, label, destination.

**Supported types**: product detail view, search, calendar open, app download, COP/DROP vote.

**Validation rules**: Product detail, calendar, and app download destinations must use existing URLs.
