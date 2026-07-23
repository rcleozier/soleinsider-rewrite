-- CreateTable
CREATE TABLE "favorites" (
    "id" SERIAL NOT NULL,
    "member_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "favorites_member_product_key" ON "favorites"("member_id", "product_id");

-- CreateIndex
CREATE INDEX "favorites_member_id_idx" ON "favorites"("member_id");
