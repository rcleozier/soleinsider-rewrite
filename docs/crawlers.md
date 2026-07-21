# SoleInsider Crawlers

Legacy crawler scripts now live in `scripts/crawlers/legacy` and save normalized releases into `temp_products` through the local ingest endpoint.

## Ingest Endpoint

- `POST /public/ingest/saveRelease`
- Accepts legacy form fields: `title`, `url`, `color`, `price`, `content`, `sku`, `releaseDate`, `hash`, `images`, `type`
- Saves to `temp_products` and `temp_product_images`
- If `CRAWLER_INGEST_SECRET` is set, requests must include `x-cron-secret: <secret>` or `Authorization: Bearer <secret>`

## Cron Routes

- `/api/cron/kith`
- `/api/cron/supdrops`
- `/api/cron/nicekicks`
- `/api/cron/soleretriever`
- `/api/cron/kicksonfire`

If `CRON_SECRET` is set, call cron routes with `x-cron-secret: <secret>` or `Authorization: Bearer <secret>`.

## CLI Commands

These commands expect the app ingest endpoint to be reachable. For local runs, start the Next app first.

```bash
npm run crawl:kith
npm run crawl:supdrops
npm run crawl:nicekicks
npm run crawl:soleretriever
npm run crawl:kicksonfire
npm run crawl:all
```

For production CLI cron, set:

```bash
SOLEINSIDER_INGEST_URL="https://your-domain.com/public/ingest/saveRelease"
CRAWLER_INGEST_SECRET="your-secret"
```

## Admin Review

- Pending queue: `/admin/tempReleases`
- Detail/approval page: `/admin/viewTempReleases/:id`

Approving a temp release creates a row in `products`, creates its `releases` record, copies gallery images into `product_images`, and marks the temp product as `approved`.
