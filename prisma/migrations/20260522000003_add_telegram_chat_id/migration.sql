-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN "alias_telegram" TEXT;
ALTER TABLE "Usuario" ADD COLUMN "telegram_chat_id" BIGINT;
ALTER TABLE "Usuario" ADD COLUMN "telegram_linked_at" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_telegram_chat_id_key" ON "Usuario"("telegram_chat_id");
