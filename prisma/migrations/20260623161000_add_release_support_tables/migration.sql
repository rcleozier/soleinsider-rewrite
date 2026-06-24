CREATE TABLE "temp_product_images" (
  "id" SERIAL NOT NULL,
  "product_id" INTEGER,
  "image" TEXT,

  CONSTRAINT "temp_product_images_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "temp_products" (
  "id" SERIAL NOT NULL,
  "name" VARCHAR(200) NOT NULL,
  "sku" VARCHAR(11) NOT NULL,
  "image" TEXT NOT NULL,
  "link" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "content" TEXT,
  "slug" VARCHAR(255) NOT NULL,
  "hash" VARCHAR(255),
  "price" DECIMAL(5, 2) NOT NULL,
  "status" VARCHAR(11) DEFAULT 'new',
  "type" VARCHAR(30) NOT NULL,
  "release_date" TIMESTAMP(0),
  "created_at" TIMESTAMP(0) NOT NULL,
  "updated_at" TIMESTAMP(0) NOT NULL,

  CONSTRAINT "temp_products_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "temp_products_id_idx" ON "temp_products"("id");

CREATE TABLE "release_interest" (
  "id" SERIAL NOT NULL,
  "member_id" INTEGER,
  "product_id" INTEGER,
  "status" INTEGER,
  "created_at" TIMESTAMP(0),

  CONSTRAINT "release_interest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "release_date_update_log" (
  "id" SERIAL NOT NULL,
  "product_id" INTEGER,
  "old_date" TIMESTAMP(0),
  "new_date" TIMESTAMP(0),
  "created_at" TIMESTAMP(0),
  "updated_at" TIMESTAMP(0),

  CONSTRAINT "release_date_update_log_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "releases" (
  "id" SERIAL NOT NULL,
  "product_id" INTEGER NOT NULL,
  "release_date" TIMESTAMP(0) NOT NULL,
  "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "releases_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "releases_product_id_idx" ON "releases"("product_id");

CREATE TABLE "product_images" (
  "id" SERIAL NOT NULL,
  "product_id" INTEGER NOT NULL,
  "optimized" BOOLEAN NOT NULL DEFAULT false,
  "image" TEXT NOT NULL,

  CONSTRAINT "product_images_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "product_checks" (
  "id" SERIAL NOT NULL,
  "product_id" INTEGER NOT NULL,
  "link" TEXT NOT NULL,
  "search_string" TEXT NOT NULL,
  "false_negative" TEXT NOT NULL,
  "status" INTEGER NOT NULL DEFAULT 1,
  "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "product_checks_pkey" PRIMARY KEY ("id")
);
