-- AlterTable
ALTER TABLE "members" ADD COLUMN "name" VARCHAR(120);

-- CreateIndex
CREATE UNIQUE INDEX "members_email_key" ON "members"("email");
