-- CreateTable
CREATE TABLE "mobile_auth_codes" (
    "id" SERIAL NOT NULL,
    "code_hash" VARCHAR(64) NOT NULL,
    "member_id" INTEGER NOT NULL,
    "expires_at" TIMESTAMP(0) NOT NULL,
    "used_at" TIMESTAMP(0),
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mobile_auth_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mobile_sessions" (
    "id" SERIAL NOT NULL,
    "token_hash" VARCHAR(64) NOT NULL,
    "member_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" TIMESTAMP(0),
    "revoked_at" TIMESTAMP(0),
    "expires_at" TIMESTAMP(0) NOT NULL,

    CONSTRAINT "mobile_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mobile_auth_codes_code_hash_key" ON "mobile_auth_codes"("code_hash");

-- CreateIndex
CREATE INDEX "mobile_auth_codes_member_id_idx" ON "mobile_auth_codes"("member_id");

-- CreateIndex
CREATE UNIQUE INDEX "mobile_sessions_token_hash_key" ON "mobile_sessions"("token_hash");

-- CreateIndex
CREATE INDEX "mobile_sessions_member_id_idx" ON "mobile_sessions"("member_id");
