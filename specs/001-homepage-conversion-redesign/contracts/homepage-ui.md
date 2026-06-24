# Homepage UI Contract

## Module Order

The homepage must render the following modules in order:

1. Hero with search
2. Newest Releases feed
3. Featured Release
4. Release Calendar Preview
5. Trending / Most Voted
6. Archive & On This Day
7. App Download CTA
8. SEO content block

## Hero Search

- Accepts free-text sneaker, brand, SKU, or release queries.
- Uses the existing `/mobileapi/search?search=` endpoint.
- Shows inline linked release results.
- Does not create or require a new backend route.
- Empty or failed searches leave the homepage usable.

## Release Modules

- Release items link to existing release/product detail URLs.
- Release items show available name, image, release date, price, SKU, brand/category, and COP/DROP signals where useful.
- Missing metadata must not be presented as confirmed.

## Calendar, Archive, and App Modules

- Calendar preview links to `/calendar`.
- Archive/on-this-day content communicates historical release depth and links to existing archive-compatible destinations.
- App CTA links to the existing iOS and Android app store URLs.

## SEO Content

- SEO content block must be crawlable page text.
- It should include useful internal links to release, calendar, brand/category, and archive-oriented paths.
- It must support homepage and release-page SEO without introducing new URL structures.
