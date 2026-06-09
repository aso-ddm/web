-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN "reset_token" TEXT;
ALTER TABLE "Usuario" ADD COLUMN "reset_token_expiry" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_reset_token_key" ON "Usuario"("reset_token");
