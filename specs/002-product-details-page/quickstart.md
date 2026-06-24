# Quickstart: Product Details Page

## Prerequisites

- Dependencies installed with `npm install`.
- `.env` configured for the existing database when validating DB-first behavior.
- Legacy seed data available for products, releases, product images, release interest, and comments.

## Validation Commands

```bash
npm run lint
npm run build
```

## Manual Validation

1. Start the app with `npm run dev`.
2. Open a legacy product URL such as `/air-jordan-14-se-reverse-ferrari/5217`.
3. Confirm the page shows an H1 sneaker title, image carousel, live countdown, price, SKU, description, and COP/DROP controls.
4. Open `/releases/air-jordan-14-se-reverse-ferrari` and confirm it renders the same improved detail experience.
5. Vote COP and DROP on a test product and confirm the visible counts update without a refresh.
6. Confirm related products appear below the main detail content, prioritize same-brand products near the release date, exclude the current product, and link locally.
7. Confirm comments remain visible below related products.
8. Test a product with one image and confirm the carousel remains stable.
9. Test a mobile viewport and confirm gallery controls, countdown, facts, voting, related carousel, and comments do not overlap.

## Expected Outcomes

- Existing product URL patterns continue to resolve.
- Product detail data is DB-backed with resilient fallback.
- COP/DROP votes persist through existing behavior.
- Related product links drive additional local product detail views.
- SEO-critical title, image, description, price, SKU, release date, and related links remain crawlable.
