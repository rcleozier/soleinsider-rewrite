CREATE TABLE "products" (
  "id" SERIAL NOT NULL,
  "name" VARCHAR(200) NOT NULL,
  "sku" VARCHAR(11) NOT NULL,
  "image" TEXT NOT NULL,
  "link" TEXT NOT NULL,
  "colorway" VARCHAR(80) NOT NULL,
  "description" TEXT NOT NULL,
  "content" TEXT,
  "slug" VARCHAR(255) NOT NULL,
  "price" DECIMAL(5, 2) NOT NULL,
  "coming_soon" INTEGER NOT NULL,
  "views" INTEGER NOT NULL DEFAULT 0,
  "resale" VARCHAR(50) NOT NULL DEFAULT 'medium',
  "type" VARCHAR(40) NOT NULL DEFAULT 'sneakers',
  "stockx_url" VARCHAR(90) NOT NULL,
  "stockx_thumbnail_url" TEXT NOT NULL,
  "stockx_ticker_symbol" VARCHAR(90) NOT NULL,
  "stockx_name" VARCHAR(90) NOT NULL,
  "stockx_make" VARCHAR(90) NOT NULL,
  "stockx_model" VARCHAR(90) NOT NULL,
  "stockx_price" INTEGER NOT NULL,
  "stockx_highest_bid" INTEGER NOT NULL,
  "stockx_total_dollars" INTEGER NOT NULL,
  "stockx_lowest_ask" INTEGER NOT NULL,
  "stockx_last_sale" INTEGER NOT NULL,
  "stockx_deadstock_sold" INTEGER NOT NULL,
  "stockx_sales_last_72" INTEGER NOT NULL,
  "created_at" TIMESTAMP(0) NOT NULL,
  "updated_at" TIMESTAMP(0) NOT NULL,

  CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "comments" (
  "id" SERIAL NOT NULL,
  "member_id" INTEGER,
  "product_id" INTEGER,
  "comment" VARCHAR(140),
  "votes_up" INTEGER NOT NULL DEFAULT 1,
  "votes_down" INTEGER NOT NULL,
  "created_at" TIMESTAMP(0),
  "updated_at" TIMESTAMP(0),

  CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "comments_product_id_idx" ON "comments"("product_id");
