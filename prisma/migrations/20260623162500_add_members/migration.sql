CREATE TABLE "members" (
  "id" SERIAL NOT NULL,
  "email" VARCHAR(80) NOT NULL,
  "password" VARCHAR(80) NOT NULL,
  "phone_number" VARCHAR(80) NOT NULL,
  "carrier" INTEGER NOT NULL,
  "member_type" VARCHAR(40),
  "verified" BYTEA NOT NULL,
  "profile_image" VARCHAR(255) NOT NULL DEFAULT 'default.png',
  "bounced_email" INTEGER NOT NULL,
  "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "members_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "email" ON "members"("email");

CREATE TABLE "member_logins" (
  "id" SERIAL NOT NULL,
  "member_id" INTEGER,
  "timestamp" TIMESTAMP(0),

  CONSTRAINT "member_logins_pkey" PRIMARY KEY ("id")
);
