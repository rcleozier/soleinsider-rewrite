# Legacy Compatibility Inventory

This document is the concrete checklist for the SoleInsider rewrite
constitution. Keep it updated when legacy PHP routes, mobile API endpoints, or
indexed public URL patterns are discovered.

## Mobile API Contracts

These endpoints are used by the existing iOS and Android apps and must remain
compatible unless a versioned replacement is introduced while the legacy
contract continues to work.

| Endpoint | Method | Used By | Request Params / Body | Required Behavior |
|---|---:|---|---|---|
| `/mobileapi/combinedUpcomingReleases` | GET | Home, Calendar | None | Return combined upcoming sneaker release data in the legacy mobile shape. |
| `/mobileapi/search?search=...` | GET | Search, related sneakers | `search` query string | Return matching releases/products in the legacy mobile shape, including product links that remain usable locally in the rewrite. |
| `/mobileapi/onThisDate?date=MM-DD` | GET | Home "On this day" | `date` query string in `MM-DD` format | Return releases matching the requested month/day in the legacy mobile shape. |
| `/public/mobile/getSlideShow?product_id=...` | GET | Product detail, story viewer | `product_id` query string | Return extra product images for the requested product using legacy slideshow fields. |
| `/mobileapi/getComments?product_id=...` | GET | Product detail comments | `product_id` query string | Return product comments in the legacy mobile shape. |
| `/mobileapi/leaveComment` | POST | Product detail comments | `body` or `comment`, `product_id`, `member_id`, `deviceId` | Accept anonymous mobile comments without breaking old clients. |
| `/mobileapi/voteComment` | POST | Product detail comments | `product_id`, `comment_id`, `comment_vote` | Accept comment votes and return/update comments using the legacy behavior. |
| `/mobileapi/coporNot` | POST | COP/DROP voting | `product_id`, `member_id`, `status` | Persist each accepted COP/DROP click as a vote event while preserving the legacy response contract. |

## Public SEO URL Patterns

These routes are compatibility surfaces because they may be indexed by Google,
shared publicly, linked from old app/web experiences, or bookmarked.

| Pattern | Example | Purpose | Required Behavior |
|---|---|---|---|
| `/` | `/` | Homepage / release discovery | Resolve locally with crawlable release discovery content. |
| `/{slug}/{product_id}` | `/women-s-speedcat-mule-toasted-almond-melted-caramel/25039` | Legacy product detail page | Resolve locally to the matching product detail page when the product exists. |
| `/releases/{slug}` | `/releases/air-jordan-14-se-reverse-ferrari` | Rewrite product detail alias | Resolve locally to the same product detail experience. |
| `/adidas-releases` | `/adidas-releases` | Brand release archive | Resolve locally with adidas release listings. |
| `/air-jordan-releases` | `/air-jordan-releases` | Brand release archive | Resolve locally with Air Jordan release listings. |
| `/nike-releases` | `/nike-releases` | Brand release archive | Resolve locally with Nike release listings. |
| `/yeezy-releases` | `/yeezy-releases` | Brand release archive | Resolve locally with Yeezy release listings. |
| `/articles` | `/articles` | Article index | Resolve locally with crawlable article links. |
| `/article/{slug}` | `/article/10-fake-sneaker-tips` | Legacy article detail | Resolve locally when the article exists. |
| `/articles/{slug}` | `/articles/air-jordan-1-authentication-guide` | Rewrite article detail alias | Resolve locally when the article exists. |
| `/calendar` | `/calendar` | Release calendar | Resolve locally with crawlable calendar content. |
| `/sneaker-history` | `/sneaker-history` | Sneaker history archive | Resolve locally with crawlable archive content. |
| `/on-this-day` | `/on-this-day` | On-this-day archive | Resolve locally or redirect intentionally to an equivalent local page. |
| `/market-data` | `/market-data` | Market data page | Resolve locally or redirect intentionally to an equivalent local page. |

## Redirect Rules

Add explicit redirects here when a legacy URL cannot be served at the same path.

| Legacy Path | New Path | Status | Notes |
|---|---|---:|---|
| TBD | TBD | 301 | Add only when a same-path local route is not practical. |

## Validation Checklist

- Smoke-test every changed endpoint in the Mobile API Contracts table.
- Smoke-test every changed route pattern in the Public SEO URL Patterns table.
- Confirm generated product and related-product links use local routes.
- Confirm canonical URLs are intentional for changed public pages.
- Confirm legacy mobile response fields remain present for old clients.
