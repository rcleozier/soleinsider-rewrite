CREATE TABLE "articles" (
  "id" SERIAL NOT NULL,
  "title" VARCHAR(255),
  "content" TEXT,
  "cover" VARCHAR(255),
  "slug" VARCHAR(255),
  "keywords" VARCHAR(255),
  "created_at" TIMESTAMP(0),
  "updated_at" TIMESTAMP(0),

  CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);
