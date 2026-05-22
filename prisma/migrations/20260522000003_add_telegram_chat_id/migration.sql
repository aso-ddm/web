-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN "telegram_chat_id" BIGINT;

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_telegram_chat_id_key" ON "Usuario"("telegram_chat_id");
